import { useState } from "react";
import { useRecover } from "./useRecover";
import toast from "react-hot-toast";
import styled, { keyframes } from "styled-components";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import StyledLink from "../../ui/StyledLink";
import SpinnerMini from "../../ui/SpinnerMini";
import { HiOutlineEnvelope } from "react-icons/hi2";

const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const RecoveryContainer = styled.div`
    padding: 3.5rem 4rem;
    border-radius: 1.6rem;
    background: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.4),
        0 4px 6px -2px rgba(0, 0, 0, 0.2);
    animation: ${fadeIn} 0.5s ease-out;
    max-width: 42rem;
    width: 100%;
`;

const Header = styled.div`
    text-align: center;
    margin-bottom: 2.5rem;
`;

const Title = styled.h2`
    font-size: 2.8rem;
    font-weight: 700;
    margin-bottom: 0.8rem;
    color: var(--primary-text-color);
`;

const Subtitle = styled.p`
    font-size: 1.4rem;
    color: var(--primary-text-color);
    opacity: 0.7;
`;

const StyledForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1.8rem;
`;

const InputGroup = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
`;

const InputLabel = styled.label`
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--primary-text-color);
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const InputWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
`;

const InputIcon = styled.span`
    position: absolute;
    left: 1.4rem;
    color: var(--secondary-text-color);
    font-size: 2rem;
    display: flex;
    align-items: center;
    pointer-events: none;
    transition: all 0.3s ease;

    ${InputWrapper}:focus-within & {
        color: var(--primary-button-color);
    }
`;

const StyledInput = styled(Input)`
    padding-left: 4.5rem;
    padding-right: 1.6rem;
    height: 5rem;
    font-size: 1.5rem;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-border-color);
    background: var(--primary-background-color);
    transition: all 0.2s ease;

    &:focus {
        border-color: var(--primary-button-color);
        box-shadow: 0 0 0 3px rgba(7, 89, 133, 0.25);
    }

    &:hover:not(:focus):not(:disabled) {
        border-color: var(--primary-button-color-hover);
    }

    &::placeholder {
        color: var(--secondary-text-color);
    }

    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px var(--primary-background-color) inset !important;
        -webkit-text-fill-color: var(--primary-text-color) !important;
        caret-color: var(--primary-text-color) !important;
        transition: background-color 5000s ease-in-out 0s;
    }
`;

const StyledButton = styled(Button)`
    width: 100%;
    height: 5rem;
    font-size: 1.6rem;
    font-weight: 600;
    border-radius: var(--border-radius-sm);
    margin-top: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s ease;
    background: var(--primary-button-color);
    border: 1px solid var(--primary-button-color);
    color: var(--primary-button-color-text);

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px -8px rgba(7, 89, 133, 0.6);
        background: var(--primary-button-color-hover);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
        background: var(--primary-button-color-active);
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
`;

const Divider = styled.div`
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin: 1.5rem 0;

    &::before,
    &::after {
        content: "";
        flex: 1;
        height: 1px;
        background: var(--primary-border-color);
    }
`;

const DividerText = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 1px;
`;

const LinksContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    font-size: 1.4rem;
`;

const LinkStyled = styled(StyledLink)`
    font-weight: 600;
    color: var(--tertiary-text-color);
    transition: all 0.2s ease;

    &:hover {
        opacity: 0.8;
        text-decoration: underline;
    }
`;

const SuccessMessage = styled.div`
    text-align: center;
    padding: 1.5rem;
    background: rgba(7, 89, 133, 0.15);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-button-color);
    margin-bottom: 1rem;
`;

const SuccessText = styled.p`
    font-size: 1.4rem;
    color: var(--primary-text-color);
`;

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
        toast.success(`A recovery email has been sent to ${email}`);
        setIsEmailSent(true);
    }

    return (
        <RecoveryContainer>
            <Header>
                <Title>Reset Password</Title>
                <Subtitle>Enter your email to receive a reset link</Subtitle>
            </Header>

            {isEmailSent && (
                <SuccessMessage>
                    <SuccessText>Recovery email sent to {email}</SuccessText>
                </SuccessMessage>
            )}

            <StyledForm onSubmit={handleSubmit}>
                <InputGroup>
                    <InputLabel htmlFor="email">Email</InputLabel>
                    <InputWrapper>
                        <InputIcon>
                            <HiOutlineEnvelope />
                        </InputIcon>
                        <StyledInput
                            value={email}
                            id="email"
                            autoComplete="email"
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            disabled={isLoading || isEmailSent}
                        />
                    </InputWrapper>
                </InputGroup>

                <StyledButton
                    $size="large"
                    type="submit"
                    disabled={isLoading || isEmailSent}
                >
                    {isLoading ? (
                        <SpinnerMini />
                    ) : isEmailSent ? (
                        "Email Sent"
                    ) : (
                        "Send Reset Link"
                    )}
                </StyledButton>
            </StyledForm>

            <Divider>
                <DividerText>or</DividerText>
            </Divider>

            <LinksContainer>
                <LinkStyled to="/login">Sign in</LinkStyled>
                <LinkStyled to="/register">Sign up</LinkStyled>
            </LinksContainer>
        </RecoveryContainer>
    );
}

export default RecoveryForm;
