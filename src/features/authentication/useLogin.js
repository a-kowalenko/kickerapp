import { useMutation, useQueryClient } from "react-query";
import { login as loginApi } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useKicker } from "../../contexts/KickerContext";
import {
    ENTER_KICKER_RETRY_ATTEMPTS,
    ENTER_KICKER_RETRY_INTERVAL,
} from "../../utils/constants";

export function useLogin() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { tryToJoinKickerAfterLogin } = useKicker();

    const {
        mutate: login,
        isLoading,
        error,
    } = useMutation({
        mutationFn: ({ email, password }) => loginApi({ email, password }),
        onSuccess: (data) => {
            console.log(data);
            queryClient.invalidateQueries();
            queryClient.setQueryData(["user"], data);

            const { kickers } = data;
            if (kickers.length === 1) {
                console.log("setCurrentKicker", kickers[0].id);

                tryToJoinKickerAfterLogin(
                    kickers[0].id,
                    ENTER_KICKER_RETRY_ATTEMPTS,
                    ENTER_KICKER_RETRY_INTERVAL,
                    () => navigate("/home")
                );
            }
        },
        onError: (err) => toast.error(err.message),
    });

    return { login, isLoading, error };
}

// const {
//     mutate: login,
//     isLoading,
//     error,
// } = useMutation({
//     mutationFn: ({ email, password }) => loginApi({ email, password }),
//     onSuccess: (data) => {
//         console.log("on login success", data);
//         queryClient.invalidateQueries(["user"]);
//         queryClient.setQueryData(["user"], data);
//         const { kickers } = data;
//         if (kickers.length === 1) {
//             console.log("setCurrentKicker", kickers[0].id);
//             setTimeout(() => {
//                 setCurrentKicker(kickers[0].id);
//                 navigate("/home", { replace: true });
//             }, 100);
//         }
//     },
//     onError: (err) => toast.error(err.message),
// });
