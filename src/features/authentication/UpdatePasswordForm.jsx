import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdatePassword } from "./useUpdatePassword";
import styled, { keyframes } from "styled-components";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import StyledLink from "../../ui/StyledLink";
import SpinnerMini from "../../ui/SpinnerMini";
import {
    HiOutlineLockClosed,
    HiOutlineExclamationTriangle,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
} from "react-icons/hi2";

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

const UpdatePasswordContainer = styled.div`
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
    border: 1px solid
        ${(props) =>
            props.$hasError
                ? "var(--error-color)"
                : "var(--primary-border-color)"};
    background: var(--primary-background-color);
    transition: all 0.2s ease;

    &:focus {
        border-color: ${(props) =>
            props.$hasError
                ? "var(--error-color)"
                : "var(--primary-button-color)"};
        box-shadow: 0 0 0 3px
            ${(props) =>
                props.$hasError
                    ? "rgba(220, 38, 38, 0.25)"
                    : "rgba(7, 89, 133, 0.25)"};
    }

    &:hover:not(:focus):not(:disabled) {
        border-color: ${(props) =>
            props.$hasError
                ? "var(--error-color)"
                : "var(--primary-button-color-hover)"};
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

const ErrorMessage = styled.span`
    font-size: 1.2rem;
    color: var(--error-color);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.2rem;
`;

const ValidationHints = styled.div`
    background: var(--primary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-sm);
    padding: 1.2rem 1.4rem;
    margin-top: 0.5rem;
`;

const ValidationHintsTitle = styled.p`
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin-bottom: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const ValidationHint = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.2rem;
    color: ${(props) =>
        props.$valid
            ? "var(--success-color, #22c55e)"
            : "var(--secondary-text-color)"};
    margin-bottom: 0.4rem;
    transition: color 0.2s ease;

    &:last-child {
        margin-bottom: 0;
    }

    svg {
        font-size: 1.4rem;
        flex-shrink: 0;
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
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.4rem;
    text-decoration: none;

    &:hover {
        opacity: 0.8;
        text-decoration: underline;
    }
`;

// Navigation Warning Modal
const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
    background: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: 1.2rem;
    padding: 2.5rem;
    max-width: 40rem;
    width: 90%;
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    color: var(--warning-color, #f59e0b);
`;

const ModalTitle = styled.h3`
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--primary-text-color);
`;

const ModalText = styled.p`
    font-size: 1.4rem;
    color: var(--primary-text-color);
    opacity: 0.8;
    margin-bottom: 2rem;
    line-height: 1.6;
`;

const ModalButtons = styled.div`
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
`;

const ModalButton = styled(Button)`
    padding: 1rem 2rem;
    font-size: 1.4rem;
`;

// Settings variant styles (simpler, for embedding in profile settings)
const SettingsForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const SettingsInputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const SettingsLabel = styled.label`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--primary-text-color);
`;

const SettingsInput = styled(Input)`
    padding: 1.2rem 1.4rem;
    font-size: 1.5rem;
    border-radius: var(--border-radius-sm);
    border: 1px solid
        ${(props) =>
            props.$hasError
                ? "var(--error-color)"
                : "var(--primary-border-color)"};
    background: var(--primary-background-color);
    transition: all 0.2s ease;

    &:hover:not(:focus):not(:disabled) {
        border-color: ${(props) =>
            props.$hasError ? "var(--error-color)" : "var(--color-grey-400)"};
        background: var(--secondary-background-color);
    }

    &:focus {
        border-color: ${(props) =>
            props.$hasError
                ? "var(--error-color)"
                : "var(--primary-button-color)"};
        box-shadow: 0 0 0 3px
            ${(props) =>
                props.$hasError
                    ? "rgba(220, 38, 38, 0.25)"
                    : "rgba(7, 89, 133, 0.25)"};
    }
`;

const SettingsButton = styled(Button)`
    align-self: flex-start;
    padding: 1.2rem 2.4rem;
    font-size: 1.4rem;
`;

const SettingsErrorMessage = styled.span`
    font-size: 1.2rem;
    color: var(--error-color);
    display: flex;
    align-items: center;
    gap: 0.4rem;
`;

const SettingsValidationHints = styled.div`
    background: var(--primary-background-color);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-sm);
    padding: 1rem 1.2rem;
    margin-top: 0.4rem;
`;

function UpdatePasswordForm({ onPasswordUpdated, variant = "recovery" }) {
    const { register, handleSubmit, formState, getValues, reset, watch } =
        useForm();
    const { errors } = formState;
    const navigate = useNavigate();
    const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);
    const [showLeaveWarning, setShowLeaveWarning] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    const { updatePassword, isLoading } = useUpdatePassword();

    // Watch password field for real-time validation hints
    const password = watch("password", "");
    const passwordConfirm = watch("passwordConfirm", "");

    // Password validation rules
    const validations = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        passwordsMatch: password === passwordConfirm && password.length > 0,
    };

    // Handle browser close/refresh warning (only for recovery variant)
    useEffect(() => {
        if (variant !== "recovery") return;

        const handleBeforeUnload = (e) => {
            if (!isPasswordUpdated) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isPasswordUpdated, variant]);

    // Custom navigation handler for soft block
    function handleNavigationAttempt(path) {
        if (!isPasswordUpdated) {
            setShowLeaveWarning(true);
            setPendingNavigation(path);
        } else {
            navigate(path);
        }
    }

    function handleStay() {
        setShowLeaveWarning(false);
        setPendingNavigation(null);
    }

    function handleLeave() {
        setShowLeaveWarning(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
        }
    }

    function onSubmit({ password }) {
        updatePassword(
            { password },
            {
                onSuccess: () => {
                    reset();
                    setIsPasswordUpdated(true);
                    if (onPasswordUpdated) {
                        onPasswordUpdated();
                    }
                    // Only navigate to home for recovery variant
                    if (variant === "recovery") {
                        navigate("/home");
                    }
                },
                onError: () => reset(),
            }
        );
    }

    // Settings variant - simpler embedded form
    if (variant === "settings") {
        return (
            <SettingsForm onSubmit={handleSubmit(onSubmit)}>
                <SettingsInputGroup>
                    <SettingsLabel htmlFor="password">
                        New Password
                    </SettingsLabel>
                    <SettingsInput
                        type="password"
                        id="password"
                        placeholder="Enter new password"
                        disabled={isLoading}
                        $hasError={!!errors?.password}
                        {...register("password", {
                            required: "A new password is required",
                            minLength: {
                                value: 8,
                                message:
                                    "Password needs a minimum of 8 characters",
                            },
                            validate: {
                                hasUppercase: (value) =>
                                    /[A-Z]/.test(value) ||
                                    "Password must contain at least one uppercase letter",
                                hasLowercase: (value) =>
                                    /[a-z]/.test(value) ||
                                    "Password must contain at least one lowercase letter",
                                hasNumber: (value) =>
                                    /[0-9]/.test(value) ||
                                    "Password must contain at least one number",
                            },
                        })}
                    />
                    {errors?.password && (
                        <SettingsErrorMessage>
                            <HiOutlineXCircle /> {errors.password.message}
                        </SettingsErrorMessage>
                    )}
                    <SettingsValidationHints>
                        <ValidationHintsTitle>
                            Password requirements
                        </ValidationHintsTitle>
                        <ValidationHint $valid={validations.minLength}>
                            {validations.minLength ? (
                                <HiOutlineCheckCircle />
                            ) : (
                                <HiOutlineXCircle />
                            )}
                            At least 8 characters
                        </ValidationHint>
                        <ValidationHint $valid={validations.hasUppercase}>
                            {validations.hasUppercase ? (
                                <HiOutlineCheckCircle />
                            ) : (
                                <HiOutlineXCircle />
                            )}
                            One uppercase letter
                        </ValidationHint>
                        <ValidationHint $valid={validations.hasLowercase}>
                            {validations.hasLowercase ? (
                                <HiOutlineCheckCircle />
                            ) : (
                                <HiOutlineXCircle />
                            )}
                            One lowercase letter
                        </ValidationHint>
                        <ValidationHint $valid={validations.hasNumber}>
                            {validations.hasNumber ? (
                                <HiOutlineCheckCircle />
                            ) : (
                                <HiOutlineXCircle />
                            )}
                            One number
                        </ValidationHint>
                    </SettingsValidationHints>
                </SettingsInputGroup>

                <SettingsInputGroup>
                    <SettingsLabel htmlFor="passwordConfirm">
                        Confirm Password
                    </SettingsLabel>
                    <SettingsInput
                        type="password"
                        id="passwordConfirm"
                        placeholder="Confirm your new password"
                        disabled={isLoading}
                        $hasError={!!errors?.passwordConfirm}
                        {...register("passwordConfirm", {
                            required: "Password confirmation is required",
                            validate: (value) =>
                                getValues().password === value ||
                                "Passwords need to match",
                        })}
                    />
                    {errors?.passwordConfirm && (
                        <SettingsErrorMessage>
                            <HiOutlineXCircle />{" "}
                            {errors.passwordConfirm.message}
                        </SettingsErrorMessage>
                    )}
                    {password && passwordConfirm && (
                        <ValidationHint $valid={validations.passwordsMatch}>
                            {validations.passwordsMatch ? (
                                <HiOutlineCheckCircle />
                            ) : (
                                <HiOutlineXCircle />
                            )}
                            Passwords match
                        </ValidationHint>
                    )}
                </SettingsInputGroup>

                <SettingsButton $variation="primary" disabled={isLoading}>
                    {isLoading ? <SpinnerMini /> : "Update Password"}
                </SettingsButton>
            </SettingsForm>
        );
    }

    // Recovery variant - full page with container, header, warnings
    return (
        <>
            <UpdatePasswordContainer>
                <Header>
                    <Title>Create New Password</Title>
                    <Subtitle>
                        Please enter a new password to secure your account
                    </Subtitle>
                </Header>

                <StyledForm onSubmit={handleSubmit(onSubmit)}>
                    <InputGroup>
                        <InputLabel htmlFor="password">New Password</InputLabel>
                        <InputWrapper>
                            <InputIcon>
                                <HiOutlineLockClosed />
                            </InputIcon>
                            <StyledInput
                                type="password"
                                id="password"
                                placeholder="Enter new password"
                                disabled={isLoading}
                                $hasError={!!errors?.password}
                                {...register("password", {
                                    required: "A new password is required",
                                    minLength: {
                                        value: 8,
                                        message:
                                            "Password needs a minimum of 8 characters",
                                    },
                                    validate: {
                                        hasUppercase: (value) =>
                                            /[A-Z]/.test(value) ||
                                            "Password must contain at least one uppercase letter",
                                        hasLowercase: (value) =>
                                            /[a-z]/.test(value) ||
                                            "Password must contain at least one lowercase letter",
                                        hasNumber: (value) =>
                                            /[0-9]/.test(value) ||
                                            "Password must contain at least one number",
                                    },
                                })}
                            />
                        </InputWrapper>
                        {errors?.password && (
                            <ErrorMessage>
                                <HiOutlineXCircle /> {errors.password.message}
                            </ErrorMessage>
                        )}

                        {/* Password validation hints */}
                        <ValidationHints>
                            <ValidationHintsTitle>
                                Password requirements
                            </ValidationHintsTitle>
                            <ValidationHint $valid={validations.minLength}>
                                {validations.minLength ? (
                                    <HiOutlineCheckCircle />
                                ) : (
                                    <HiOutlineXCircle />
                                )}
                                At least 8 characters
                            </ValidationHint>
                            <ValidationHint $valid={validations.hasUppercase}>
                                {validations.hasUppercase ? (
                                    <HiOutlineCheckCircle />
                                ) : (
                                    <HiOutlineXCircle />
                                )}
                                One uppercase letter
                            </ValidationHint>
                            <ValidationHint $valid={validations.hasLowercase}>
                                {validations.hasLowercase ? (
                                    <HiOutlineCheckCircle />
                                ) : (
                                    <HiOutlineXCircle />
                                )}
                                One lowercase letter
                            </ValidationHint>
                            <ValidationHint $valid={validations.hasNumber}>
                                {validations.hasNumber ? (
                                    <HiOutlineCheckCircle />
                                ) : (
                                    <HiOutlineXCircle />
                                )}
                                One number
                            </ValidationHint>
                        </ValidationHints>
                    </InputGroup>

                    <InputGroup>
                        <InputLabel htmlFor="passwordConfirm">
                            Confirm Password
                        </InputLabel>
                        <InputWrapper>
                            <InputIcon>
                                <HiOutlineLockClosed />
                            </InputIcon>
                            <StyledInput
                                type="password"
                                id="passwordConfirm"
                                placeholder="Confirm your new password"
                                disabled={isLoading}
                                $hasError={!!errors?.passwordConfirm}
                                {...register("passwordConfirm", {
                                    required:
                                        "Password confirmation is required",
                                    validate: (value) =>
                                        getValues().password === value ||
                                        "Passwords need to match",
                                })}
                            />
                        </InputWrapper>
                        {errors?.passwordConfirm && (
                            <ErrorMessage>
                                <HiOutlineXCircle />{" "}
                                {errors.passwordConfirm.message}
                            </ErrorMessage>
                        )}
                        {password && passwordConfirm && (
                            <ValidationHint $valid={validations.passwordsMatch}>
                                {validations.passwordsMatch ? (
                                    <HiOutlineCheckCircle />
                                ) : (
                                    <HiOutlineXCircle />
                                )}
                                Passwords match
                            </ValidationHint>
                        )}
                    </InputGroup>

                    <StyledButton
                        $size="large"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? <SpinnerMini /> : "Update Password"}
                    </StyledButton>
                </StyledForm>

                <Divider>
                    <DividerText>or</DividerText>
                </Divider>

                <LinksContainer>
                    <LinkStyled
                        as="button"
                        type="button"
                        onClick={() => handleNavigationAttempt("/login")}
                    >
                        Back to Sign in
                    </LinkStyled>
                </LinksContainer>
            </UpdatePasswordContainer>

            {/* Navigation Warning Modal */}
            {showLeaveWarning && (
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>
                            <HiOutlineExclamationTriangle size={28} />
                            <ModalTitle>Leave without saving?</ModalTitle>
                        </ModalHeader>
                        <ModalText>
                            You haven&apos;t updated your password yet. If you
                            leave now, you may need to request a new recovery
                            link to change your password.
                        </ModalText>
                        <ModalButtons>
                            <ModalButton
                                $variation="secondary"
                                type="button"
                                onClick={handleStay}
                            >
                                Stay & Update Password
                            </ModalButton>
                            <ModalButton
                                $variation="danger"
                                type="button"
                                onClick={handleLeave}
                            >
                                Leave Anyway
                            </ModalButton>
                        </ModalButtons>
                    </ModalContent>
                </ModalOverlay>
            )}
        </>
    );
}

export default UpdatePasswordForm;
