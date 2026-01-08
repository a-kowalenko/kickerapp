import { useQuery, useMutation, useQueryClient } from "react-query";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import {
    getKickerPermissions,
    grantPermission,
    revokePermission,
    PERMISSION_TYPES,
} from "../../services/apiUserPermissions";
import toast from "react-hot-toast";

/**
 * Hook to fetch all user permissions for a kicker (admin only)
 */
export function useKickerPermissions() {
    const { data: kickerData } = useKickerInfo();
    const kickerId = kickerData?.id;

    const {
        data: users,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["kickerPermissions", kickerId],
        queryFn: () => getKickerPermissions(kickerId),
        enabled: !!kickerId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    return {
        users: users || [],
        isLoading,
        error,
        kickerId,
    };
}

/**
 * Hook to grant a permission
 */
export function useGrantPermission() {
    const queryClient = useQueryClient();
    const { data: kickerData } = useKickerInfo();
    const kickerId = kickerData?.id;

    const { mutate: grant, isPending: isGranting } = useMutation({
        mutationFn: ({ userId, permissionType }) =>
            grantPermission(userId, kickerId, permissionType),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["kickerPermissions", kickerId],
            });
            // Also invalidate individual permission checks
            queryClient.invalidateQueries({
                queryKey: ["permission"],
            });
            toast.success("Permission granted");
        },
        onError: (error) => {
            toast.error(`Failed to grant permission: ${error.message}`);
        },
    });

    return { grant, isGranting };
}

/**
 * Hook to revoke a permission
 */
export function useRevokePermission() {
    const queryClient = useQueryClient();
    const { data: kickerData } = useKickerInfo();
    const kickerId = kickerData?.id;

    const { mutate: revoke, isPending: isRevoking } = useMutation({
        mutationFn: ({ userId, permissionType }) =>
            revokePermission(userId, kickerId, permissionType),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["kickerPermissions", kickerId],
            });
            // Also invalidate individual permission checks
            queryClient.invalidateQueries({
                queryKey: ["permission"],
            });
            toast.success("Permission revoked");
        },
        onError: (error) => {
            toast.error(`Failed to revoke permission: ${error.message}`);
        },
    });

    return { revoke, isRevoking };
}

/**
 * Hook to toggle a permission
 */
export function useTogglePermission() {
    const { grant, isGranting } = useGrantPermission();
    const { revoke, isRevoking } = useRevokePermission();

    const toggle = ({ userId, permissionType, currentValue }) => {
        if (currentValue) {
            revoke({ userId, permissionType });
        } else {
            grant({ userId, permissionType });
        }
    };

    return {
        toggle,
        isToggling: isGranting || isRevoking,
    };
}

// Re-export for convenience
export { PERMISSION_TYPES };
