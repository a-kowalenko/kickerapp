import { useState } from "react";
import { useRecover } from "./useRecover";
import toast from "react-hot-toast";
import styled from "styled-components";
import FormRow from "../../ui/FormRow";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import StyledLink from "../../ui/StyledLink";
import SpinnerMini from "../../ui/SpinnerMini";

const LoginContainer = styled.div`
    padding: 1.2rem 2.4rem;
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--primary-border-color);
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
`;

const StyledForm = styled.form``;

function RecoveryForm() {
    const [email, setEmail] = useState("");
    const [isEmailSent, setIsEmailSent] = useState(false);
    const { recover, isLoading, error } = useRecover();

    function handleSubmit(e) {
        e.preventDefault();
        if (!email) {
            return toast.error(
                "We couldn't verify your account with that information."
            );
        }

        recover({ email }, { onSuccess: () => handleRecoverySubmitted() });
    }

    function handleRecoverySubmitted() {
        toast.success(`An recovery email has been sent to ${email}`);
        setIsEmailSent(true);
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
                        disabled={isLoading || isEmailSent}
                    />
                </FormRow>

                <FormRow fill={true}>
                    <Button
                        $size="large"
                        type="submit"
                        disabled={isLoading || isEmailSent}
                    >
                        {isLoading ? (
                            <SpinnerMini />
                        ) : isEmailSent ? (
                            "Recovery email is sent"
                        ) : (
                            "Reset password"
                        )}
                    </Button>
                </FormRow>
                <FormRow>
                    <StyledLink to="/login">Login</StyledLink>
                    <StyledLink to="/register">Register</StyledLink>
                </FormRow>
            </StyledForm>
        </LoginContainer>
    );
}

export default RecoveryForm;
