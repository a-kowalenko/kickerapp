import { useMutation, useQueryClient } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { updateSeason as updateSeasonApi } from "../../services/apiSeason";

export function useUpdateSeason() {
    const queryClient = useQueryClient();
    const { currentKicker: kicker } = useKicker();
    const { mutate: updateSeason, isLoading: isUpdatingSeason } = useMutation({
        mutationFn: updateSeasonApi,
        onSuccess: () => {
            queryClient.invalidateQueries(["current_season"]);
        },
    });

    return { updateSeason, isUpdatingSeason };
}
