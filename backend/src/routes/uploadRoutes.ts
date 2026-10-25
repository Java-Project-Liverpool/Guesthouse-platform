import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { authenticate, requireAdmin } from "../middleware/authMiddleware";
import {
  ImageValidationError,
  galleryFolder,
  logoFolder,
  maxImageSizeBytes,
  uploadImage,
  validateImageFile
} from "../services/imageService";

const router = Router();

/*
 * multer reads the uploaded file out of the request.
 * The file is kept in memory, so nothing is written to the server's disk,
 * and it is passed straight on to Cloudinary.
 * The size limit stops oversized files before they are fully received.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxImageSizeBytes, files: 1 }
});

// Where each kind of image is stored inside Cloudinary
const folders: Record<string, string> = {
  logo: logoFolder,
  gallery: galleryFolder
};

/*
 * Run multer and turn its errors into clear responses.
 * The file must be sent in a form field named "image".
 */
function receiveImage(req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, (error?: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Images must be 5 MB or smaller." });
      }

      return res.status(400).json({ message: "Invalid image upload." });
    }

    if (error) {
      console.error("Could not read the uploaded file.", error);
      return res.status(500).json({ message: "Could not upload image." });
    }

    return next();
  });
}

/*
 * POST /api/uploads/image?type=logo
 * POST /api/uploads/image?type=gallery
 *
 * Admin only. Uploads one image to Cloudinary and returns its URL and
 * public ID. The admin app then sends these values when it saves the
 * guesthouse, so the database stores the URL and not the image itself.
 */
router.post(
  "/image",
  authenticate,
  requireAdmin,
  receiveImage,
  async (req: Request, res: Response) => {
    // Check that the client said what kind of image this is
    const type = typeof req.query.type === "string" ? req.query.type : "";
    const folder = folders[type];

    if (!folder) {
      return res.status(400).json({ message: "type must be logo or gallery." });
    }

    // Check that a file was actually sent
    if (!req.file) {
      return res.status(400).json({ message: "Send an image in the image field." });
    }

    try {
      validateImageFile(req.file);

      // If Cloudinary credentials are set up, store in Cloudinary
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const image = await uploadImage(req.file, folder);
        return res.status(201).json(image);
      }

      // Otherwise in development/prototype mode, return as data URI
      const base64 = req.file.buffer.toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${base64}`;
      const uniqueId = `prototype-${type}-${Date.now()}`;
      return res.status(201).json({
        url: dataUri,
        publicId: uniqueId
      });
    } catch (error) {
      // A bad file type or size is the client's mistake
      if (error instanceof ImageValidationError) {
        return res.status(400).json({ message: error.message });
      }

      console.error("Could not upload image.", error);
      return res.status(500).json({ message: "Could not upload image." });
    }
  }
);

export default router;