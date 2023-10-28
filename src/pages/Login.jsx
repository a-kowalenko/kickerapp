import { useEffect } from "react";
import LoginForm from "../features/authentication/LoginForm";
import { useUser } from "../features/authentication/useUser";
import { useNavigate } from "react-router-dom";

function Login() {
    const { user, isLoading } = useUser();
    const navigate = useNavigate();

    useEffect(
        function () {
            if (!isLoading && user) {
                navigate("/home");
            }
        },
        [isLoading, user, navigate]
    );

    return (
        <div>
            <LoginForm />
        </div>
    );
}

export default Login;
