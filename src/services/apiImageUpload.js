import imageCompression from "browser-image-compression";
import supabase, { databaseSchema } from "./supabase";

// Constants
const BUCKET_NAME = "chat-images";
const MAX_FILE_SIZE_MB = 1; // 1MB max original file size
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const COMPRESSION_OPTIONS = {
    maxSizeMB: 0.3, // Compress to ~300KB
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/webp",
};

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
];

/**
 * Validate file before upload
 * @param {File} file - The file to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFile(file) {
    if (!file) {
        return { valid: false, error: "No file provided" };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.map(
                (t) => t.split("/")[1]
            ).join(", ")}`,
        };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
            valid: false,
            error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`,
        };
    }

    return { valid: true };
}

/**
 * Compress an image file
 * @param {File} file - The image file to compress
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<File>} Compressed file
 */
export async function compressImage(file, onProgress) {
    // Skip compression for GIFs to preserve animation
    if (file.type === "image/gif") {
        return file;
    }

    try {
        const compressedFile = await imageCompression(file, {
            ...COMPRESSION_OPTIONS,
            onProgress: (progress) => {
                if (onProgress) {
                    onProgress(Math.round(progress));
                }
            },
        });

        console.log(
            `[ImageUpload] Compressed ${file.name}: ${(
                file.size / 1024
            ).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`
        );

        return compressedFile;
    } catch (error) {
        console.error("[ImageUpload] Compression error:", error);
        throw new Error("Failed to compress image");
    }
}

/**
 * Generate a unique file path for the upload
 * @param {number} kickerId - The kicker ID
 * @param {number} playerId - The player ID
 * @param {string} originalName - Original file name
 * @returns {string} Unique file path
 */
function generateFilePath(kickerId, playerId, originalName) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const extension = originalName.includes("gif") ? "gif" : "webp";
    return `${kickerId}/${playerId}/${timestamp}_${randomId}.${extension}`;
}

/**
 * Upload an image to Supabase Storage
 * @param {Object} params
 * @param {File} params.file - The file to upload (already compressed)
 * @param {number} params.kickerId - The kicker ID
 * @param {number} params.playerId - The player ID
 * @returns {Promise<{ path: string, url: string }>}
 */
export async function uploadImage({ file, kickerId, playerId }) {
    const filePath = generateFilePath(kickerId, playerId, file.name);

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            contentType: file.type === "image/gif" ? "image/gif" : "image/webp",
            cacheControl: "31536000", // 1 year cache
            upsert: false,
        });

    if (error) {
        console.error("[ImageUpload] Upload error:", error);
        throw new Error(error.message || "Failed to upload image");
    }

    // Get the public URL
    const {
        data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return {
        path: data.path,
        url: publicUrl,
    };
}

/**
 * Delete an image from Supabase Storage
 * @param {string} path - The file path to delete
 * @returns {Promise<boolean>}
 */
export async function deleteImage(path) {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
        console.error("[ImageUpload] Delete error:", error);
        throw new Error(error.message || "Failed to delete image");
    }

    return true;
}

/**
 * Get the public URL for an image
 * @param {string} path - The file path
 * @returns {string} Public URL
 */
export function getImageUrl(path) {
    const {
        data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return publicUrl;
}

/**
 * Format image URL as [img:url] syntax for storage in message content
 * @param {string} url - The image URL
 * @returns {string} Formatted string
 */
export function formatImageTag(url) {
    return `[img:${url}]`;
}

/**
 * Check if a user has permission to upload images
 * @param {string} userId - The user ID
 * @param {number} kickerId - The kicker ID
 * @returns {Promise<boolean>}
 */
export async function checkUploadPermission(userId, kickerId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("has_permission", {
            p_user_id: userId,
            p_kicker_id: kickerId,
            p_permission_type: "can_upload_images",
        });

    if (error) {
        console.error("[ImageUpload] Permission check error:", error);
        return false;
    }

    return data === true;
}
