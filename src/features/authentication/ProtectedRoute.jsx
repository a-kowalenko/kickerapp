import { useEffect } from "react";
import { useUser } from "./useUser";
import { useNavigate } from "react-router-dom";
import Spinner from "../../ui/Spinner";
import { useKicker } from "../../contexts/KickerContext";
import { verifyKickerMembership } from "../../services/apiKicker";
import { useQuery } from "react-query";
import toast from "react-hot-toast";

function ProtectedRoute({ children }) {
    const { user, isLoading: isUserLoading, isAuthenticated } = useUser();
    const { currentKicker } = useKicker();
    const navigate = useNavigate();

    const {
        data,
        isLoading: isVerifyingMembership,
        isError,
    } = useQuery({
        queryKey: ["verifyMembership", user?.id, currentKicker],
        queryFn: () => verifyKickerMembership(user.id, currentKicker),
        retry: 0,
        enabled: isAuthenticated && !!currentKicker,
        onSuccess: (isMember) => {
            if (!isMember) {
                toast.error(
                    "Unauthorized access attempt: User cannot enter this kicker."
                );
                navigate("/");
            }
        },
        onError: () => {
            toast.error(
                "Unauthorized access attempt: User cannot enter this kicker."
            );
            navigate("/");
        },
    });

    useEffect(
        function () {
            if (!isUserLoading && !isVerifyingMembership) {
                if (isError || !isAuthenticated || !currentKicker) {
                    navigate("/");
                }
            }
        },
        [
            isUserLoading,
            isVerifyingMembership,
            isError,
            isAuthenticated,
            currentKicker,
            navigate,
        ]
    );

    if (isUserLoading || isVerifyingMembership) {
        return <Spinner />;
    }

    if (isError || !isAuthenticated || !currentKicker) {
        return null;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
