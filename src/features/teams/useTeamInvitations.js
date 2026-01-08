import { useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import supabase, { databaseSchema } from "../../services/supabase";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import {
    getPendingInvitations,
    getSentInvitations,
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
} from "../../services/apiTeams";
import toast from "react-hot-toast";

const TEAM_INVITATIONS_TABLE = "team_invitations";

/**
 * Hook to manage team invitations with real-time updates
 */
export function useTeamInvitations() {
    const queryClient = useQueryClient();
    const { data: player } = useOwnPlayer();
    const playerId = player?.id;

    // Query for pending invitations received
    const {
        data: pendingInvitations,
        isLoading: isLoadingPending,
        error: pendingError,
    } = useQuery({
        queryKey: ["team-invitations", "pending", playerId],
        queryFn: () => getPendingInvitations(playerId),
        enabled: !!playerId,
        staleTime: 1000 * 30, // 30 seconds
    });

    // Query for sent invitations
    const {
        data: sentInvitations,
        isLoading: isLoadingSent,
        error: sentError,
    } = useQuery({
        queryKey: ["team-invitations", "sent", playerId],
        queryFn: () => getSentInvitations(playerId),
        enabled: !!playerId,
        staleTime: 1000 * 30,
    });

    // Mutation to accept invitation
    const acceptMutation = useMutation({
        mutationFn: acceptInvitation,
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries(["team-invitations"]);
                queryClient.invalidateQueries(["teams"]);
                toast.success(`Joined team "${data.team_name}"!`);
            } else {
                toast.error(data.error || "Failed to accept invitation");
            }
        },
        onError: (error) => {
            toast.error(error.message || "Failed to accept invitation");
        },
    });

    // Mutation to decline invitation
    const declineMutation = useMutation({
        mutationFn: declineInvitation,
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries(["team-invitations"]);
                queryClient.invalidateQueries(["teams"]);
                toast.success("Invitation declined");
            } else {
                toast.error(data.error || "Failed to decline invitation");
            }
        },
        onError: (error) => {
            toast.error(error.message || "Failed to decline invitation");
        },
    });

    // Mutation to cancel sent invitation
    const cancelMutation = useMutation({
        mutationFn: cancelInvitation,
        onSuccess: () => {
            queryClient.invalidateQueries(["team-invitations"]);
            queryClient.invalidateQueries(["teams"]);
            toast.success("Invitation cancelled");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to cancel invitation");
        },
    });

    // Real-time subscription for invitation changes
    const handleRealtimeChange = useCallback(
        (payload) => {
            // Invalidate queries to refetch
            queryClient.invalidateQueries(["team-invitations"]);
            queryClient.invalidateQueries(["teams"]);

            // Show toast for new invitations received
            if (
                payload.eventType === "INSERT" &&
                payload.new.invited_player_id === playerId
            ) {
                toast("New team invitation!", {
                    icon: "👥",
                    duration: 5000,
                });
            }
        },
        [queryClient, playerId]
    );

    useEffect(() => {
        if (!playerId) return;

        // Subscribe to invitations where user is invited
        const invitedChannel = supabase
            .channel(`team-invitations-invited-${playerId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: databaseSchema,
                    table: TEAM_INVITATIONS_TABLE,
                    filter: `invited_player_id=eq.${playerId}`,
                },
                handleRealtimeChange
            )
            .subscribe();

        // Subscribe to invitations where user is inviting (to see when accepted/declined)
        const invitingChannel = supabase
            .channel(`team-invitations-inviting-${playerId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: databaseSchema,
                    table: TEAM_INVITATIONS_TABLE,
                    filter: `inviting_player_id=eq.${playerId}`,
                },
                (payload) => {
                    queryClient.invalidateQueries(["team-invitations"]);
                    queryClient.invalidateQueries(["teams"]);

                    // Notify when invitation is accepted or declined
                    if (payload.new.status === "accepted") {
                        toast.success("Your team invitation was accepted!");
                    } else if (payload.new.status === "declined") {
                        toast("Your team invitation was declined", {
                            icon: "😔",
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(invitedChannel);
            supabase.removeChannel(invitingChannel);
        };
    }, [playerId, queryClient, handleRealtimeChange]);

    return {
        // Received invitations
        pendingInvitations: pendingInvitations || [],
        pendingCount: pendingInvitations?.length || 0,
        isLoadingPending,
        pendingError,

        // Sent invitations
        sentInvitations: sentInvitations || [],
        isLoadingSent,
        sentError,

        // Actions
        acceptInvitation: acceptMutation.mutate,
        isAccepting: acceptMutation.isLoading,

        declineInvitation: declineMutation.mutate,
        isDeclining: declineMutation.isLoading,

        cancelInvitation: cancelMutation.mutate,
        isCancelling: cancelMutation.isLoading,
    };
}

/**
 * Hook to get pending invitation count (for badge)
 */
export function usePendingInvitationCount() {
    const { data: player } = useOwnPlayer();
    const playerId = player?.id;

    const { data } = useQuery({
        queryKey: ["team-invitations", "pending", playerId],
        queryFn: () => getPendingInvitations(playerId),
        enabled: !!playerId,
        staleTime: 1000 * 30,
    });

    return data?.length || 0;
}
