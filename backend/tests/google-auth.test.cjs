const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { OAuth2Client } = require("google-auth-library");

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("Set MONGODB_URI to a local dumela_google_auth_test database before running this test.");
}

const parsedMongoUri = new URL(mongoUri);
if (
  !["localhost", "127.0.0.1", "::1"].includes(parsedMongoUri.hostname) ||
  parsedMongoUri.pathname !== "/dumela_google_auth_test"
) {
  throw new Error("Google authentication tests are restricted to the local dumela_google_auth_test database.");
}

const googleClientId = "google-web-client-id.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_ID = googleClientId;
process.env.JWT_SECRET = "local-google-test-secret-with-at-least-32-bytes";

const User = require("../dist/models/User").default;
const authRoutes = require("../dist/routes/authRoutes").default;
const claimsByToken = new Map();
const originalVerifyIdToken = OAuth2Client.prototype.verifyIdToken;
let server;
let baseUrl;

before(async () => {
  await mongoose.connect(mongoUri);
  await mongoose.connection.dropDatabase();
  await User.init();

  OAuth2Client.prototype.verifyIdToken = async function ({ idToken, audience }) {
    assert.equal(audience, googleClientId);
    const claims = claimsByToken.get(idToken);
    if (!claims) throw new Error("mock rejected invalid Google token");
    return { getPayload: () => claims };
  };

  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/auth`;
});

after(async () => {
  OAuth2Client.prototype.verifyIdToken = originalVerifyIdToken;
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

function tokenClaims(overrides = {}) {
  return {
    iss: "https://accounts.google.com",
    aud: googleClientId,
    exp: Math.floor(Date.now() / 1000) + 600,
    sub: "google-subject-1001",
    email: "traveller@example.invalid",
    email_verified: true,
    name: "Google Traveller",
    ...overrides
  };
}

async function googleSignIn(idToken, bodyExtra = {}) {
  return fetch(`${baseUrl}/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, ...bodyExtra })
  });
}

test("verified Google customer is registered once and receives the app JWT", async () => {
  claimsByToken.set("new-google-token", tokenClaims());
  const firstResponse = await googleSignIn("new-google-token", { role: "admin", email: "attacker@example.invalid" });
  assert.equal(firstResponse.status, 201);
  const firstPayload = await firstResponse.json();
  assert.ok(firstPayload.token);
  assert.equal(firstPayload.user.email, "traveller@example.invalid");
  assert.equal(firstPayload.user.authProvider, "google");
  assert.equal(firstPayload.user.role, "customer");

  const stored = await User.findOne({ googleId: "google-subject-1001" }).select("+passwordHash");
  assert.ok(stored);
  assert.equal(stored.authProvider, "google");
  assert.equal(stored.role, "customer");
  assert.equal(stored.passwordHash, undefined);
  assert.equal(await User.countDocuments(), 1);

  const repeatResponse = await googleSignIn("new-google-token");
  assert.equal(repeatResponse.status, 200);
  const repeatPayload = await repeatResponse.json();
  assert.equal(repeatPayload.user.id, firstPayload.user.id);
  assert.equal(await User.countDocuments(), 1);
  assert.equal(jwt.verify(firstPayload.token, process.env.JWT_SECRET).role, "customer");
});

test("Google registration uses a safe fallback when profile name is unavailable", async () => {
  claimsByToken.set("missing-profile-name-token", tokenClaims({
    sub: "google-subject-without-name",
    email: "a@example.invalid",
    name: undefined
  }));
  const response = await googleSignIn("missing-profile-name-token");
  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.user.name, "Dumela traveller");
  assert.equal(payload.user.role, "customer");
});

test("Google does not silently link an existing local account by email", async () => {
  const localUser = await User.create({
    name: "Local Customer",
    email: "local@example.invalid",
    password: "local-test-password",
    role: "customer",
    authProvider: "local"
  });
  claimsByToken.set("local-collision-token", tokenClaims({
    sub: "different-google-subject",
    email: "local@example.invalid"
  }));

  const response = await googleSignIn("local-collision-token");
  const payload = await response.json();
  assert.equal(response.status, 409);
  assert.equal(payload.code, "AUTH_METHOD_MISMATCH");
  const unchanged = await User.findById(localUser._id);
  assert.equal(unchanged.authProvider, "local");
  assert.equal(unchanged.googleId, undefined);
  assert.equal(await User.countDocuments({ email: "local@example.invalid" }), 1);
});

test("suspended Google customers and Google-backed administrator records receive no app token", async () => {
  await User.create({
    name: "Suspended Customer",
    email: "suspended@example.invalid",
    authProvider: "google",
    googleId: "google-suspended-subject",
    isActive: false,
    role: "customer"
  });
  claimsByToken.set("suspended-google-token", tokenClaims({
    sub: "google-suspended-subject",
    email: "suspended@example.invalid"
  }));

  const suspendedResponse = await googleSignIn("suspended-google-token");
  const suspendedPayload = await suspendedResponse.json();
  assert.equal(suspendedResponse.status, 403);
  assert.equal(suspendedPayload.code, "ACCOUNT_SUSPENDED");
  assert.equal(suspendedPayload.token, undefined);

  await User.create({
    name: "Google Admin Record",
    email: "admin-google@example.invalid",
    authProvider: "google",
    googleId: "google-admin-subject",
    role: "admin"
  });
  claimsByToken.set("admin-google-token", tokenClaims({
    sub: "google-admin-subject",
    email: "admin-google@example.invalid"
  }));
  const adminResponse = await googleSignIn("admin-google-token");
  assert.equal(adminResponse.status, 403);
  assert.equal((await adminResponse.json()).token, undefined);
});

test("invalid, expired, wrong-audience, and unverified identities are rejected", async () => {
  claimsByToken.set("expired-google-token", tokenClaims({ exp: Math.floor(Date.now() / 1000) - 1 }));
  claimsByToken.set("wrong-audience-google-token", tokenClaims({ aud: "another-client-id" }));
  claimsByToken.set("unverified-google-token", tokenClaims({ email_verified: false }));

  for (const idToken of [
    "not-a-google-token",
    "expired-google-token",
    "wrong-audience-google-token",
    "unverified-google-token"
  ]) {
    const response = await googleSignIn(idToken);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, "GOOGLE_AUTH_INVALID");
  }
  assert.equal(await User.countDocuments({ email: "traveller@example.invalid" }), 1);
});

test("missing Google configuration and database failures return safe errors without issuing tokens", async () => {
  const configuredClientId = process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_ID;
  const unconfiguredResponse = await googleSignIn("new-google-token");
  process.env.GOOGLE_CLIENT_ID = configuredClientId;
  assert.equal(unconfiguredResponse.status, 503);
  assert.equal((await unconfiguredResponse.json()).code, "GOOGLE_AUTH_NOT_CONFIGURED");

  const originalFindOne = User.findOne;
  User.findOne = () => { throw new Error("private database connection detail"); };
  try {
    const databaseFailure = await googleSignIn("new-google-token");
    const payload = await databaseFailure.json();
    assert.equal(databaseFailure.status, 500);
    assert.equal(payload.token, undefined);
    assert.equal(JSON.stringify(payload).includes("private database connection detail"), false);
  } finally {
    User.findOne = originalFindOne;
  }
});
