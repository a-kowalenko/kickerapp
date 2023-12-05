import { useMutation, useQueryClient } from "react-query";
import { updateSeasonConfig as updateSeasonConfigApi } from "../../services/apiSeason";
import { useKicker } from "../../contexts/KickerContext";

export function useUpdateSeasonConfig() {
    const queryClient = useQueryClient();
    const { currentKicker: kicker } = useKicker();
    const { mutate: updateSeasonConfig, isLoading: isUpdatingSeasonConfig } =
        useMutation({
            mutationFn: ({ frequency, season_mode }) =>
                updateSeasonConfigApi({
                    frequency,
                    season_mode,
                    kicker,
                }),
            onSuccess: () => {
                queryClient.invalidateQueries(["kicker-info", kicker]);
            },
        });

    return { updateSeasonConfig, isUpdatingSeasonConfig };
}
