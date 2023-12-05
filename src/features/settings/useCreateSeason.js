import { useMutation, useQueryClient } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { createNewSeason as createNewSeasonApi } from "../../services/apiSeason";

export function useCreateSeason() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const { mutate: createNewSeason, isLoading: isCreatingNewSeason } =
        useMutation({
            mutationFn: (seasonData) => createNewSeasonApi(seasonData, kicker),
            onSuccess: () => {
                queryClient.invalidateQueries("current_season", kicker);
            },
        });

    return { createNewSeason, isCreatingNewSeason };
}
