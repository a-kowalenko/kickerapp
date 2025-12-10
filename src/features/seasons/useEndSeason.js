import { useMutation, useQueryClient } from "react-query";
import { endSeason as endSeasonApi } from "../../services/apiSeasons";
import { useKicker } from "../../contexts/KickerContext";
import toast from "react-hot-toast";

export function useEndSeason() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const { mutate: endSeason, isLoading: isEnding } = useMutation({
        mutationFn: (seasonId) => endSeasonApi(seasonId),
        onSuccess: (data) => {
            toast.success(`Season "${data.name}" ended successfully!`);
            queryClient.invalidateQueries(["seasons", kicker]);
            queryClient.invalidateQueries(["currentSeason", kicker]);
            queryClient.invalidateQueries(["kicker-info", kicker]);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return { endSeason, isEnding };
}
