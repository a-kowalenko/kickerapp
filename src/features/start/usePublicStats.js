import { useQuery } from "react-query";
import supabase from "../../services/supabase";

async function getPublicStats() {
    const { data, error } = await supabase.rpc("get_public_global_stats");

    if (error) {
        console.error("Error fetching public stats:", error);
        throw new Error(error.message);
    }

    return data?.[0] || null;
}

export function usePublicStats() {
    const {
        data: stats,
        isLoading,
        error,
    } = useQuery(["publicStats"], getPublicStats, {
        staleTime: 1000 * 60 * 30, // 30 minutes - stats don't need to be real-time
        cacheTime: 1000 * 60 * 60, // 1 hour cache
        retry: 1, // Only retry once for public stats
        refetchOnWindowFocus: false,
    });

    return { stats, isLoading, error };
}
