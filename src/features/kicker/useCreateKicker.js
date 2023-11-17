import { useMutation } from "react-query";
import { createKicker as createKickerApi } from "../../services/apiKicker";
import { useKicker } from "../../contexts/KickerContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function useCreateKicker() {
    const { setCurrentKicker } = useKicker();
    const navigate = useNavigate();

    const { mutate, isLoading } = useMutation({
        mutationFn: ({ name }) => createKickerApi({ name }),
        onSuccess: async (data) => {
            try {
                await setCurrentKicker(data.id);
                navigate("/home");
            } catch (error) {
                console.error("Error setting current kicker:", error);
                toast.error(error.message);
            }
        },
    });

    return { createKicker: mutate, isLoading };
}
