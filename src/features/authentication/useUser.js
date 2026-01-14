import { useQuery } from "react-query";
import { getCurrentUser } from "../../services/apiAuth";

export function useUser() {
    const {
        data: user,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["user"],
        queryFn: getCurrentUser,
    });

    return {
        user,
        isLoading,
        isAuthenticated: user?.role === "authenticated",
        isSuperAdmin: user?.app_metadata?.is_super_admin === true,
    };
}
