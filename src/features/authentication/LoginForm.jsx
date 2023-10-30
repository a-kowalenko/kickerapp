import { useState } from "react";
import { useLogin } from "./useLogin";
import toast from "react-hot-toast";
import styled from "styled-components";
import FormRow from "../../ui/FormRow";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import StyledLink from "../../ui/StyledLink";

const LoginContainer = styled.div`
    /* background-color: blue; */
    padding: 1.2rem 2.4rem;
    border-radius: var(--border-radius-lg);
    border: 1px solid black;
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);
`;

const StyledForm = styled.form``;

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, isLoading, error } = useLogin();

    function handleSubmit(e) {
        e.preventDefault();
        if (!email || !password) {
            return toast.error(
                "We couldn't verify your account with that information."
            );
        }

        login({ email, password });
    }

    return (
        <LoginContainer>
            <StyledForm onSubmit={handleSubmit}>
                <FormRow label="Email">
                    <Input
                        value={email}
                        id="email"
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email"
                        disabled={isLoading}
                    />
                </FormRow>
                <FormRow label="Password">
                    <Input
                        value={password}
                        id="password"
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        autoComplete="current-password"
                        placeholder="password"
                        disabled={isLoading}
                    />
                </FormRow>
                <FormRow fill={true}>
                    <Button $size="large" type="submit" disabled={isLoading}>
                        Login
                    </Button>
                </FormRow>
                <FormRow label="No account?">
                    <StyledLink to="/register">Register</StyledLink>
                </FormRow>
            </StyledForm>
        </LoginContainer>
    );
}

export default LoginForm;
