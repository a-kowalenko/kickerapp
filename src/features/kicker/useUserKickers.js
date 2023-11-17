import { useQuery } from "react-query";
import { getUserKickers } from "../../services/apiKicker";
import toast from "react-hot-toast";

export function useUserKickers() {
    const { data, isLoading } = useQuery({
        queryKey: ["kickers"],
        queryFn: getUserKickers,
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return { kickers: data, isLoadingKickers: isLoading };
}
