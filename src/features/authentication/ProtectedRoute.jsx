import { useEffect } from "react";
import { useUser } from "./useUser";
import { useNavigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const { user, isLoading, isAuthenticated } = useUser();
    const navigate = useNavigate();

    useEffect(
        function () {
            if (!isAuthenticated && !isLoading) {
                navigate("/");
            }
        },
        [isAuthenticated, isLoading, navigate]
    );

    if (isLoading) {
        return <div>Spinner...</div>;
    }

    if (isAuthenticated) {
        return <>{children}</>;
    }
}

export default ProtectedRoute;
