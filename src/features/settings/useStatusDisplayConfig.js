import { useQuery, useMutation, useQueryClient } from "react-query";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import {
    getStatusDisplayConfig,
    updateStatusDisplayConfig,
    batchUpdateStatusDisplayConfig,
} from "./apiStatusDisplayConfig";
import toast from "react-hot-toast";

/**
 * Hook to fetch status display configuration
 */
export function useStatusDisplayConfig() {
    const { data: kickerData } = useKickerInfo();
    const kickerId = kickerData?.id;

    const {
        data: config,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["statusDisplayConfig", kickerId],
        queryFn: () => getStatusDisplayConfig(kickerId),
        enabled: !!kickerId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Transform to camelCase
    const transformedConfig = config?.map((item) => ({
        id: item.id,
        statusKey: item.status_key,
        displayName: item.display_name,
        layer: item.layer,
        priority: item.priority,
        isExclusive: item.is_exclusive,
        isEnabled: item.is_enabled,
    }));

    return {
        config: transformedConfig || [],
        isLoading,
        error,
        kickerId,
    };
}

/**
 * Hook to update a single status config
 */
export function useUpdateStatusConfig() {
    const queryClient = useQueryClient();
    const { data: kickerData } = useKickerInfo();
    const kickerId = kickerData?.id;

    const { mutate: updateConfig, isPending: isUpdating } = useMutation({
        mutationFn: (params) =>
            updateStatusDisplayConfig({ kickerId, ...params }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["statusDisplayConfig", kickerId],
            });
            toast.success("Status config updated");
        },
        onError: (error) => {
            toast.error(`Failed to update: ${error.message}`);
        },
    });

    return { updateConfig, isUpdating };
}

/**
 * Hook to batch update status configs
 */
export function useBatchUpdateStatusConfig() {
    const queryClient = useQueryClient();
    const { data: kickerData } = useKickerInfo();
    const kickerId = kickerData?.id;

    const { mutate: batchUpdate, isPending: isBatchUpdating } = useMutation({
        mutationFn: (configs) =>
            batchUpdateStatusDisplayConfig({ kickerId, configs }),
        onSuccess: (count) => {
            queryClient.invalidateQueries({
                queryKey: ["statusDisplayConfig", kickerId],
            });
            toast.success(`Updated ${count} status configurations`);
        },
        onError: (error) => {
            toast.error(`Failed to update: ${error.message}`);
        },
    });

    return { batchUpdate, isBatchUpdating };
}
