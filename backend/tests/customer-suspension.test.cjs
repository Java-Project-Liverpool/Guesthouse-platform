const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("Set MONGODB_URI to a local dumela_suspension_test database before running this test.");
}

const parsedMongoUri = new URL(mongoUri);
if (
  !["localhost", "127.0.0.1", "::1"].includes(parsedMongoUri.hostname) ||
  parsedMongoUri.pathname !== "/dumela_suspension_test"
) {
  throw new Error("Suspension tests are restricted to the local dumela_suspension_test database.");
}

process.env.JWT_SECRET = "local-suspension-test-secret-with-at-least-32-bytes";

const User = require("../dist/models/User").default;
const adminRoutes = require("../dist/routes/adminRoutes").default;
const { attachRequestId } = require("../dist/middleware/requestId");
let server;
let baseUrl;
let admin;
let customer;
let adminToken;
let customerToken;

before(async () => {
  await mongoose.connect(mongoUri);
  await mongoose.connection.dropDatabase();
  await User.init();

  admin = await User.create({
    name: "Local Test Admin",
    email: "admin@suspension-test.invalid",
    password: "test-admin-password",
    role: "admin"
  });
  customer = await User.create({
    name: "Local Test Customer",
    email: "customer@suspension-test.invalid",
    password: "test-customer-password",
    role: "customer"
  });

  adminToken = jwt.sign({ sub: String(admin._id), role: "admin" }, process.env.JWT_SECRET, { algorithm: "HS256" });
  customerToken = jwt.sign({ sub: String(customer._id), role: "customer" }, process.env.JWT_SECRET, { algorithm: "HS256" });

  const app = express();
  app.use(express.json());
  app.use(attachRequestId);
  app.use("/api/admin", adminRoutes);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/admin/customers/${customer._id}/status`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("admin can suspend and reactivate a customer, with each state persisted", async () => {
  const oldSaveCandidate = await User.findById(customer._id);
  assert.equal(oldSaveCandidate.passwordHash, undefined);
  await assert.rejects(() => oldSaveCandidate.save(), (error) => error.name === "ValidationError");

  const suspendedResponse = await fetch(baseUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: false })
  });
  assert.equal(suspendedResponse.status, 200);
  const suspendedPayload = await suspendedResponse.json();
  assert.equal(suspendedPayload.user._id, String(customer._id));
  assert.equal(suspendedPayload.user.isActive, false);
  assert.ok(suspendedResponse.headers.get("x-request-id"));
  assert.equal((await User.findById(customer._id).select("isActive").lean()).isActive, false);

  const reactivatedResponse = await fetch(baseUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: true })
  });
  assert.equal(reactivatedResponse.status, 200);
  assert.equal((await User.findById(customer._id).select("isActive").lean()).isActive, true);
});

test("missing authentication and non-admin accounts cannot change status", async () => {
  const missingAuth = await fetch(baseUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: false })
  });
  assert.equal(missingAuth.status, 401);

  const invalidAuth = await fetch(baseUrl, {
    method: "PUT",
    headers: { Authorization: "Bearer invalid-token", "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: false })
  });
  assert.equal(invalidAuth.status, 401);

  const customerRequest = await fetch(baseUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${customerToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: false })
  });
  assert.equal(customerRequest.status, 403);
  assert.equal((await User.findById(customer._id).select("isActive").lean()).isActive, true);
});

test("invalid IDs and status payloads receive 400 without changing the record", async () => {
  const invalidIdResponse = await fetch(baseUrl.replace(String(customer._id), "not-an-object-id"), {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: false })
  });
  assert.equal(invalidIdResponse.status, 400);

  const invalidBodyResponse = await fetch(baseUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: "false" })
  });
  assert.equal(invalidBodyResponse.status, 400);

  const missingCustomerId = new mongoose.Types.ObjectId();
  const missingCustomerResponse = await fetch(baseUrl.replace(String(customer._id), String(missingCustomerId)), {
    method: "PUT",
    headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: false })
  });
  assert.equal(missingCustomerResponse.status, 404);
  assert.equal((await User.findById(customer._id).select("isActive").lean()).isActive, true);
});

test("database errors return a safe diagnostic reference without exposing details", async () => {
  const originalUpdate = User.findOneAndUpdate;
  User.findOneAndUpdate = () => ({
    select: () => Promise.reject(new Error("private database connection detail"))
  });

  try {
    const response = await fetch(baseUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false })
    });
    const payload = await response.json();
    assert.equal(response.status, 500);
    assert.equal(payload.message, "Could not update customer status.");
    assert.match(payload.requestId, /^[0-9a-f-]{36}$/i);
    assert.equal(JSON.stringify(payload).includes("private database connection detail"), false);
  } finally {
    User.findOneAndUpdate = originalUpdate;
  }
});
