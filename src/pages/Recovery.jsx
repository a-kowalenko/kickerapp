import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useUser } from "../features/authentication/useUser";
import RecoveryForm from "../features/authentication/RecoveryForm";

const StyledLogin = styled.div`
    height: 100dvh;
    display: flex;
    justify-content: center;
    align-items: center;

    background-color: var(--secondary-background-color);
`;

function Recovery() {
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
            <RecoveryForm />
        </StyledLogin>
    );
}

export default Recovery;
