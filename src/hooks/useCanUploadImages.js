import { useQuery } from "react-query";
import { useUser } from "../features/authentication/useUser";
import { useKicker } from "../contexts/KickerContext";
import {
    hasPermission,
    PERMISSION_TYPES,
} from "../services/apiUserPermissions";

/**
 * Hook to check if the current user can upload images
 * @returns {{ canUpload: boolean, isLoading: boolean }}
 */
export function useCanUploadImages() {
    const { user } = useUser();
    const { currentKicker: kickerId } = useKicker();

    const { data: canUpload, isLoading } = useQuery({
        queryKey: ["permission", "can_upload_images", user?.id, kickerId],
        queryFn: () =>
            hasPermission(
                user.id,
                kickerId,
                PERMISSION_TYPES.CAN_UPLOAD_IMAGES
            ),
        enabled: !!user?.id && !!kickerId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
    });

    return {
        canUpload: canUpload === true,
        isLoading,
    };
}
