import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../features/authentication/useUser";
import LoginForm from "../features/authentication/LoginForm";

const StyledLogin = styled.div`
    height: 100dvh;
    display: flex;
    justify-content: center;
    align-items: center;

    background-color: var(--color-amber-50);
`;

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
        <StyledLogin>
            <LoginForm />
        </StyledLogin>
    );
}

export default Login;
