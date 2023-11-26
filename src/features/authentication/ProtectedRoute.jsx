import { useEffect } from "react";
import { useUser } from "./useUser";
import { useNavigate } from "react-router-dom";
import Spinner from "../../ui/Spinner";
import { useKicker } from "../../contexts/KickerContext";
import { verifyKickerMembership } from "../../services/apiKicker";
import { useQuery } from "react-query";
import toast from "react-hot-toast";
import styled from "styled-components";

const LoadingBackground = styled.div`
    background-color: var(--secondary-background-color);
    width: 100%;
    height: 100dvh;
`;

function ProtectedRoute({ children }) {
    console.log("RENDER ProtectedRoute");
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
            console.log("ProtectedRoute success", isMember);
            if (!isMember) {
                toast.error(
                    "Unauthorized access attempt: User cannot enter this kicker."
                );
                navigate("/");
            }
        },
        onError: () => {
            console.log("ProtectedRoute error");
            toast.error(
                "Unauthorized access attempt: User cannot enter this kicker."
            );
            navigate("/");
        },
    });

    useEffect(
        function () {
            console.log("ProtectedRoute effect");
            if (!isUserLoading && !isVerifyingMembership) {
                if (isError || !isAuthenticated || !currentKicker) {
                    console.log("isError", isError);
                    console.log("!isAuthenticated", !isAuthenticated);
                    console.log("!currentKicker", !currentKicker);
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
        return (
            <LoadingBackground>
                <Spinner />
            </LoadingBackground>
        );
    }

    if (isError || !isAuthenticated || !currentKicker) {
        return (
            <LoadingBackground>
                <Spinner />
            </LoadingBackground>
        );
    }

    return <>{children}</>;
}

export default ProtectedRoute;
