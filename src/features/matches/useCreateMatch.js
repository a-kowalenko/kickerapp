import { useMutation, useQueryClient } from "react-query";
import { createMatch as createMatchApi } from "../../services/apiMatches";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function useCreateMatch() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { mutate: createMatch, isLoading } = useMutation({
        mutationFn: createMatchApi,
        onSuccess: (data) => {
            toast.success(`Match ${data.id} started`);
            queryClient.setQueryData(["match", data.id], data);
            navigate(`/matches/${data.id}`);
        },
        onError: (err) => toast.error(err),
    });

    return { createMatch, isLoading };
}
