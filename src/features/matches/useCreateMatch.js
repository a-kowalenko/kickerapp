import { useMutation, useQueryClient } from "react-query";
import {
    createMatch as createMatchApi,
    createTeamMatch as createTeamMatchApi,
} from "../../services/apiMatches";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useKicker } from "../../contexts/KickerContext";
import { useMatchContext } from "../../contexts/MatchContext";
import { TEAMS } from "../../utils/constants";

export function useCreateMatch() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { currentKicker: kicker } = useKicker();
    const { setActiveMatch } = useMatchContext();

    const { mutate: createMatch, isLoading } = useMutation({
        mutationFn: (matchData) => {
            // Check if this is a team match
            if (matchData.isTeamMatch) {
                return createTeamMatchApi({
                    team1: matchData.team1,
                    team2: matchData.team2,
                    kicker,
                });
            }
            // Individual player match
            return createMatchApi({ players: matchData, kicker });
        },
        onSuccess: (data) => {
            toast.success(`Match ${data.id} started`);
            setActiveMatch(data);
            queryClient.setQueryData(["match", data.id, kicker], data);
            // Invalidate teams queries in case MMR updates are needed later
            queryClient.invalidateQueries([TEAMS]);
            navigate(`/matches/${data.id}`);
        },
        onError: (err) => toast.error(err.message),
    });

    return { createMatch, isLoading };
}
