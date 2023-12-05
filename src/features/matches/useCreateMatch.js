import { useMutation, useQueryClient } from "react-query";
import { createMatch as createMatchApi } from "../../services/apiMatches";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useKicker } from "../../contexts/KickerContext";
import { useMatchContext } from "../../contexts/MatchContext";

export function useCreateMatch() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { currentKicker: kicker } = useKicker();
    const { setActiveMatch } = useMatchContext();

    const { mutate: createMatch, isLoading } = useMutation({
        mutationFn: (players, isSeasonMatch) =>
            createMatchApi({ players, kicker, isSeasonMatch }),
        onSuccess: (data) => {
            toast.success(`Match ${data.id} started`);
            setActiveMatch(data);
            queryClient.setQueryData(["match", data.id, kicker], data);
            navigate(`/matches/${data.id}`);
        },
        onError: (err) => toast.error(err),
    });

    return { createMatch, isLoading };
}
