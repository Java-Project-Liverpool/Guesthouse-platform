import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { authenticate, requireAdmin, requireCustomer } from "../middleware/authMiddleware";
import Rating from "../models/Rating";
import Report, { reportStatuses, type ReportStatus } from "../models/Report";
 
const router = Router();
 
// These statuses mean an admin has finished handling the report, so they get a completion time and admin ID.
const closedStatuses: ReportStatus[] = ["resolved", "dismissed"];
 
// Check status values from requests before using them in a database query or update.
function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" && (reportStatuses as readonly string[]).includes(value);
}
 
// Return field-specific messages when Mongoose rejects report data.
function sendValidationError(error: mongoose.Error.ValidationError, res: Response) {
  const errors = Object.fromEntries(
    Object.entries(error.errors).map(([field, issue]) => [field, issue.message])
  );
 
  return res.status(400).json({ message: "Invalid report data.", errors });
}
 
// Customers can report a rating for admin review. Validate the input and confirm the rating exists first.
router.post("/", authenticate, requireCustomer, async (req: Request, res: Response) => {
  const { ratingId, reason } = (req.body ?? {}) as { ratingId?: unknown; reason?: unknown };
 
  if (typeof ratingId !== "string" || !mongoose.isObjectIdOrHexString(ratingId)) {
    return res.status(400).json({ message: "A valid ratingId is required." });
  }
 
  if (typeof reason !== "string" || reason.trim() === "") {
    return res.status(400).json({ message: "A reason is required." });
  }
 
  try {
    const ratingExists = await Rating.exists({ _id: ratingId });
    if (!ratingExists) {
      return res.status(404).json({ message: "Rating not found." });
    }
 
    const report = await Report.create({
      customerId: req.authenticatedUser!.id,
      ratingId,
      reason: reason.trim()
    });
 
    return res.status(201).json({ report });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return sendValidationError(error, res);
    }
 
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: "Invalid report data.", field: error.path });
    }
 
    console.error("Could not create report.", error);
    return res.status(500).json({ message: "Could not create report." });
  }
});
 
// Customers see only reports they submitted; newest reports appear first.
router.get("/mine", authenticate, requireCustomer, async (req: Request, res: Response) => {
  try {
    const reports = await Report.find({ customerId: req.authenticatedUser!.id })
      .populate("ratingId")
      .sort({ createdAt: -1 });
 
    return res.json({ reports });
  } catch (error) {
    console.error("Could not retrieve reports.", error);
    return res.status(500).json({ message: "Could not retrieve reports." });
  }
});
 
// Admins use this list to review reports. The optional status filter narrows the queue, for example ?status=pending.
router.get("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const filter: { status?: ReportStatus } = {};
 
  if (typeof req.query.status === "string" && req.query.status.trim() !== "") {
    const status = req.query.status.trim();
 
    if (!isReportStatus(status)) {
      return res
        .status(400)
        .json({ message: `status must be one of: ${reportStatuses.join(", ")}.` });
    }
 
    filter.status = status;
  }
 
  try {
    const reports = await Report.find(filter)
      .populate("ratingId")
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });
 
    return res.json({ reports });
  } catch (error) {
    console.error("Could not retrieve reports.", error);
    return res.status(500).json({ message: "Could not retrieve reports." });
  }
});
 
// Admins update a report after reviewing it. A final status records who handled it and when;
// moving it back to a non-final status clears that completion information.
router.patch("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Report ID is invalid." });
  }
 
  const { status } = (req.body ?? {}) as { status?: unknown };
 
  if (!isReportStatus(status)) {
    return res
      .status(400)
      .json({ message: `status must be one of: ${reportStatuses.join(", ")}.` });
  }
 
  // Keep completion details in sync with the selected status so reopened reports look active again.
  const update = closedStatuses.includes(status)
    ? { $set: { status, resolvedAt: new Date(), resolvedBy: req.authenticatedUser!.id } }
    : { $set: { status }, $unset: { resolvedAt: "", resolvedBy: "" } };
 
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });
 
    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }
 
    return res.json({ report });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return sendValidationError(error, res);
    }
 
    console.error("Could not update report.", error);
    return res.status(500).json({ message: "Could not update report." });
  }
});
 
export default router;
 
