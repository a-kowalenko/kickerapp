import { useState, useCallback } from "react";
import { useKicker } from "../contexts/KickerContext";
import { useOwnPlayer } from "./useOwnPlayer";
import {
    validateImageFile,
    compressImage,
    uploadImage,
    formatImageTag,
} from "../services/apiImageUpload";

/**
 * Hook for handling image upload with compression and progress tracking
 * @returns {{
 *   uploadImageFile: (file: File) => Promise<string>,
 *   isUploading: boolean,
 *   progress: number,
 *   error: string | null,
 *   reset: () => void
 * }}
 */
export function useImageUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const { currentKicker: kickerId } = useKicker();
    const { data: player } = useOwnPlayer();

    const reset = useCallback(() => {
        setIsUploading(false);
        setProgress(0);
        setError(null);
    }, []);

    const uploadImageFile = useCallback(
        async (file) => {
            if (!kickerId || !player?.id) {
                throw new Error("Not logged in or no kicker selected");
            }

            // Validate file
            const validation = validateImageFile(file);
            if (!validation.valid) {
                setError(validation.error);
                throw new Error(validation.error);
            }

            setIsUploading(true);
            setProgress(0);
            setError(null);

            try {
                // Compression phase (0-50%)
                setProgress(5);
                const compressedFile = await compressImage(file, (p) => {
                    setProgress(Math.round(5 + p * 0.45)); // 5-50%
                });
                setProgress(50);

                // Upload phase (50-100%)
                setProgress(55);
                const { url } = await uploadImage({
                    file: compressedFile,
                    kickerId,
                    playerId: player.id,
                });
                setProgress(100);

                // Reset after short delay
                setTimeout(() => {
                    reset();
                }, 500);

                // Return formatted tag
                return formatImageTag(url);
            } catch (err) {
                const errorMessage = err.message || "Upload failed";
                setError(errorMessage);
                setIsUploading(false);
                throw err;
            }
        },
        [kickerId, player?.id, reset]
    );

    return {
        uploadImageFile,
        isUploading,
        progress,
        error,
        reset,
    };
}
