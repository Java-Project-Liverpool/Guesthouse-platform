import { v2 as cloudinary } from "cloudinary";

/*
 * The parts of an uploaded file that this service uses.
 * The file objects that multer produces have this shape.
 */
export interface UploadFile {
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/*
 * Image service for guesthouse logos and gallery images.
 *
 * Images are stored in Cloudinary. MongoDB only keeps the image URL
 * and the public ID, which is needed later to delete the image.
 */

// The image types we accept, and the largest file size allowed (5 MB)
export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
export const maxImageSizeBytes = 5 * 1024 * 1024;

// What we keep about an uploaded image
export interface UploadedImage {
  url: string;
  publicId: string;
}

/*
 * Thrown when the file itself is not acceptable (wrong type, too big).
 * The routes can answer these with a 400, because it is the client's mistake.
 */
export class ImageValidationError extends Error {}

let configured = false;

/*
 * Set up Cloudinary the first time it is needed.
 *
 * This is done here and not at the top of the file because the .env file
 * is only loaded after all the imports have run, so the credentials do not
 * exist yet at that point. The credentials never leave the backend.
 */
const configureCloudinary = (): void => {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are not configured.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true // always use https links
  });

  configured = true;
};

/*
 * Check that an uploaded file is an allowed type and not too large.
 */
export const validateImageFile = (file: UploadFile): void => {
  if (!allowedImageTypes.includes(file.mimetype)) {
    throw new ImageValidationError("Only JPEG, PNG and WebP images are allowed.");
  }

  if (file.size > maxImageSizeBytes) {
    throw new ImageValidationError("Images must be 5 MB or smaller.");
  }
};

/*
 * Upload one image to Cloudinary and return its URL and public ID.
 *
 * The folder keeps logos and gallery images separate inside Cloudinary,
 * for example "guesthouse-platform/logos".
 */
export const uploadImage = async (
  file: UploadFile,
  folder: string
): Promise<UploadedImage> => {
  validateImageFile(file);
  configureCloudinary();

  return new Promise<UploadedImage>((resolve, reject) => {
    // Cloudinary also checks the real file format, not only the label
    // the client sent, so a renamed non-image file is refused
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"]
      },
      (error, result) => {
        if (error || !result) {
          // Log the real reason for developers, but keep the message
          // that goes back to the client short and generic
          console.error("Cloudinary upload failed.", error);
          reject(new Error("Image upload failed."));
          return;
        }

        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    // Send the file, which multer is holding in memory, to Cloudinary
    stream.end(file.buffer);
  });
};

/*
 * Delete one image from Cloudinary using its public ID.
 * An image that is already gone counts as deleted.
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  configureCloudinary();

  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true // also clear any cached copies
    });

    if (response.result !== "ok" && response.result !== "not found") {
      throw new Error(`Unexpected result: ${response.result}`);
    }
  } catch (error) {
    console.error("Cloudinary deletion failed.", error);
    throw new Error("Image deletion failed.");
  }
};

/*
 * Delete several images, for example when a gallery is replaced.
 *
 * A failed deletion only leaves an unused image behind in Cloudinary,
 * so it is logged here and does not make the whole request fail.
 */
export const deleteImages = async (publicIds: string[]): Promise<void> => {
  const results = await Promise.allSettled(publicIds.map((id) => deleteImage(id)));

  results.forEach((outcome, index) => {
    if (outcome.status === "rejected") {
      console.error(`Could not delete image ${publicIds[index]}.`);
    }
  });
};

/*
 * The folders inside Cloudinary where guesthouse images are kept.
 * The upload route and the guesthouse routes both use these, so an image
 * can only be saved to a guesthouse from the folder it was uploaded to.
 */
export const logoFolder = "guesthouse-platform/logos";
export const galleryFolder = "guesthouse-platform/gallery";

/*
 * Check that an image URL and public ID really belong to our Cloudinary
 * account and to the expected folder, and that they match each other.
 *
 * This matters because the public ID is later used to delete the image.
 * Without this check, a request could name any image and have it deleted.
 */
export const isOwnImage = (
  url: unknown,
  publicId: unknown,
  folder: string
): boolean => {
  if (typeof url !== "string" || typeof publicId !== "string") return false;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;

  // The public ID must sit directly inside the expected folder
  const idPrefix = `${folder}/`;
  if (!publicId.startsWith(idPrefix)) return false;

  const fileName = publicId.slice(idPrefix.length);
  if (fileName === "" || fileName.includes("/") || fileName.includes("..")) {
    return false;
  }

  // The URL must be an https link on our own Cloudinary account
  const urlPrefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;
  if (!url.startsWith(urlPrefix)) return false;

  // After the optional version (like "v1712345678/"), the URL must be the
  // public ID followed by a file extension and nothing else
  const rest = url.slice(urlPrefix.length).replace(/^v\d+\//, "");
  if (!rest.startsWith(`${publicId}.`)) return false;

  return /^[a-z0-9]+$/i.test(rest.slice(publicId.length + 1));
};