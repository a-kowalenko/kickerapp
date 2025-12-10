import { useMutation, useQueryClient } from "react-query";
import { createSeason as createSeasonApi } from "../../services/apiSeasons";
import { useKicker } from "../../contexts/KickerContext";
import toast from "react-hot-toast";

export function useCreateSeason() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const { mutate: createSeason, isLoading: isCreating } = useMutation({
        mutationFn: ({ name }) => createSeasonApi({ kickerId: kicker, name }),
        onSuccess: (data) => {
            toast.success(`Season "${data.name}" created successfully!`);
            queryClient.invalidateQueries(["seasons", kicker]);
            queryClient.invalidateQueries(["currentSeason", kicker]);
            queryClient.invalidateQueries(["kicker-info", kicker]);
            queryClient.invalidateQueries(["rankings"]);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return { createSeason, isCreating };
}
