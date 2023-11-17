import { useMutation } from "react-query";
import { joinKicker as joinKickerApi } from "../../services/apiKicker";

export function useJoinKicker() {
    const { mutate, isLoading } = useMutation({
        mutationFn: ({ accessToken }) => joinKickerApi({ accessToken }),
    });

    return { joinKicker: mutate, isLoading };
}
