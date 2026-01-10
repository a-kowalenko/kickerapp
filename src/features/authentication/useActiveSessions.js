import { useMutation, useQuery, useQueryClient } from "react-query";
import {
    getActiveSessions,
    getCurrentSessionId,
    terminateOtherSessions as terminateOtherSessionsApi,
    terminateSession as terminateSessionApi,
} from "../../services/apiAuth";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

export function useActiveSessions() {
    const [currentSessionId, setCurrentSessionId] = useState(null);

    // Get current session ID on mount
    useEffect(() => {
        getCurrentSessionId().then(setCurrentSessionId);
    }, []);

    const {
        data: sessions,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["activeSessions"],
        queryFn: getActiveSessions,
        staleTime: 5 * 1000, // 5 seconds
        refetchInterval: 10 * 1000, // Poll every 10 seconds
    });

    return {
        sessions,
        isLoading,
        error,
        currentSessionId,
        sessionCount: sessions?.length ?? 0,
    };
}

export function useTerminateSession() {
    const queryClient = useQueryClient();

    const { mutate: terminateSession, isLoading: isTerminating } = useMutation({
        mutationFn: terminateSessionApi,
        onSuccess: () => {
            toast.success("Session terminated");
            queryClient.invalidateQueries(["activeSessions"]);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to terminate session");
        },
    });

    return { terminateSession, isTerminating };
}

export function useTerminateOtherSessions() {
    const queryClient = useQueryClient();

    const { mutate: terminateOtherSessions, isLoading: isTerminatingAll } =
        useMutation({
            mutationFn: terminateOtherSessionsApi,
            onSuccess: (deletedCount) => {
                toast.success(
                    `${deletedCount} session${
                        deletedCount !== 1 ? "s" : ""
                    } terminated`
                );
                queryClient.invalidateQueries(["activeSessions"]);
            },
            onError: (error) => {
                toast.error(error.message || "Failed to terminate sessions");
            },
        });

    return { terminateOtherSessions, isTerminatingAll };
}
