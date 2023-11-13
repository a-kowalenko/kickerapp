import styled from "styled-components";
import RegisterForm from "../features/authentication/RegisterForm";

const StyledRegister = styled.div`
    height: 100dvh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--secondary-background-color);
`;

function Register() {
    return (
        <StyledRegister>
            <RegisterForm />
        </StyledRegister>
    );
}

export default Register;
