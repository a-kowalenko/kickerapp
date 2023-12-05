import { useMutation, useQueryClient } from "react-query";
import { deletePendingSeason } from "../../services/apiSeason";
import { useKicker } from "../../contexts/KickerContext";

export function useDeleteSeason() {
    const queryClient = useQueryClient();
    const { currentKicker: kicker } = useKicker();
    const { mutate: cancelSeason, isLoading: isCancelingSeason } = useMutation({
        mutationFn: () => deletePendingSeason(kicker),
        onSuccess: () => {
            queryClient.invalidateQueries(["current_season", kicker]);
        },
    });

    return { cancelSeason, isCancelingSeason };
}
