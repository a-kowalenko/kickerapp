import { useMutation } from "react-query";
import { createMatch as createMatchApi } from "../../services/apiMatches";
import { useNavigate } from "react-router-dom";

export function useCreateMatch() {
    const navigate = useNavigate();
    const { mutate: createMatch, isLoading } = useMutation({
        mutationFn: createMatchApi,
        onSuccess: (data) => {
            console.log("success", data);
            navigate(`/matches/${data.id}`);
        },
        onError: (err) => console.error(err),
    });

    return { createMatch, isLoading };
}
