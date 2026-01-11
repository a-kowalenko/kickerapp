import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UpdatePasswordForm from "../features/authentication/UpdatePasswordForm";
import styled, { keyframes } from "styled-components";
import supabase from "../services/supabase";
import Button from "../ui/Button";
import StyledLink from "../ui/StyledLink";
import SpinnerMini from "../ui/SpinnerMini";
import {
    HiOutlineExclamationCircle,
    HiOutlineArrowPath,
    HiOutlineArrowRightOnRectangle,
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

const StyledUpdatePassword = styled.main`
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-background-color);
    padding: 2rem;
`;

const ErrorContainer = styled.div`
    padding: 3.5rem 4rem;
    border-radius: 1.6rem;
    background: var(--secondary-background-color);
    border: 1px solid var(--primary-border-color);
    box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.4),
        0 4px 6px -2px rgba(0, 0, 0, 0.2);
    animation: ${fadeIn} 0.5s ease-out;
    max-width: 42rem;
    width: 100%;
    text-align: center;
`;

const ErrorIcon = styled.div`
    color: var(--error-color, #dc2626);
    margin-bottom: 1.5rem;

    svg {
        width: 6rem;
        height: 6rem;
    }
`;

const ErrorTitle = styled.h2`
    font-size: 2.4rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--primary-text-color);
`;

const ErrorText = styled.p`
    font-size: 1.4rem;
    color: var(--primary-text-color);
    opacity: 0.7;
    margin-bottom: 2.5rem;
    line-height: 1.6;
`;

const ErrorButtons = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const StyledButton = styled(Button)`
    width: 100%;
    height: 5rem;
    font-size: 1.5rem;
    font-weight: 600;
    border-radius: var(--border-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;

    svg {
        font-size: 2rem;
    }
`;

const LinkStyled = styled(StyledLink)`
    font-weight: 600;
    color: var(--tertiary-text-color);
    font-size: 1.4rem;
    margin-top: 1rem;
    display: inline-block;

    &:hover {
        opacity: 0.8;
        text-decoration: underline;
    }
`;

const LoadingContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 4rem;
`;

const LoadingText = styled.p`
    font-size: 1.4rem;
    color: var(--primary-text-color);
    opacity: 0.7;
`;

function UpdatePassword() {
    const [isValidSession, setIsValidSession] = useState(null); // null = loading, true = valid, false = invalid
    const [errorType, setErrorType] = useState(null); // 'expired', 'invalid', 'no-session', 'access_denied'
    const isVerifyingRef = useRef(false); // Prevent double verification
    const isMountedRef = useRef(true); // Track if component is mounted
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        isMountedRef.current = true;

        // Check for error parameters in URL (both query string and hash)
        function checkUrlForErrors() {
            // Check query string first
            const queryError = searchParams.get("error");
            const queryErrorCode = searchParams.get("error_code");
            const queryErrorDescription = searchParams.get("error_description");

            // Also check hash (Supabase sometimes puts errors there)
            const hash = window.location.hash.substring(1);
            const hashParams = new URLSearchParams(hash);
            const hashError = hashParams.get("error");
            const hashErrorCode = hashParams.get("error_code");
            const hashErrorDescription = hashParams.get("error_description");

            const error = queryError || hashError;
            const errorCode = queryErrorCode || hashErrorCode;
            const errorDescription =
                queryErrorDescription || hashErrorDescription;

            if (error || errorCode) {
                console.log("URL error detected:", {
                    error,
                    errorCode,
                    errorDescription,
                });

                if (
                    errorCode === "otp_expired" ||
                    errorDescription?.includes("expired")
                ) {
                    setErrorType("expired");
                } else if (error === "access_denied") {
                    setErrorType("access_denied");
                } else {
                    setErrorType("invalid");
                }
                setIsValidSession(false);
                return true;
            }
            return false;
        }

        // Check URL for errors first
        if (checkUrlForErrors()) {
            return;
        }

        // Prevent running if already verifying
        if (isVerifyingRef.current) {
            return;
        }

        async function verifyRecoveryToken() {
            // Mark as verifying immediately
            isVerifyingRef.current = true;

            try {
                // Check for token in query params (from custom email template)
                const token = searchParams.get("token");
                const type = searchParams.get("type");

                if (token && type === "recovery") {
                    console.log("Verifying recovery token:", token);

                    // Use verifyOtp with the token hash
                    const { data, error } = await supabase.auth.verifyOtp({
                        token_hash: token,
                        type: "recovery",
                    });

                    console.log("verifyOtp result:", { data, error });

                    if (!isMountedRef.current) return;

                    if (error) {
                        console.error("Token verification error:", error);
                        if (
                            error.message?.includes("expired") ||
                            error.message?.includes("invalid")
                        ) {
                            setErrorType("expired");
                        } else {
                            setErrorType("invalid");
                        }
                        setIsValidSession(false);
                        return;
                    }

                    if (data?.session) {
                        console.log(
                            "Recovery token verified successfully, session:",
                            data.session
                        );
                        setIsValidSession(true);
                        return;
                    } else {
                        // Token was valid but no session returned - shouldn't happen
                        console.log(
                            "No session in response, checking current session..."
                        );
                    }
                }

                // Fallback: Check if there's already a valid session (e.g., from hash-based flow)
                console.log("Checking for existing session...");
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                console.log("Current session:", session);

                if (!isMountedRef.current) return;

                if (error) {
                    console.error("Session error:", error);
                    setErrorType("invalid");
                    setIsValidSession(false);
                    return;
                }

                if (session) {
                    console.log("Found existing session");
                    setIsValidSession(true);
                    return;
                }

                // No token provided and no session - show error
                console.log("No token and no session found");
                setErrorType("no-session");
                setIsValidSession(false);
            } catch (err) {
                if (!isMountedRef.current) return;
                console.error("Recovery check error:", err);
                setErrorType("invalid");
                setIsValidSession(false);
            }
        }

        verifyRecoveryToken();

        return () => {
            isMountedRef.current = false;
        };
    }, [searchParams]);

    // Loading state
    if (isValidSession === null) {
        return (
            <StyledUpdatePassword>
                <ErrorContainer>
                    <LoadingContainer>
                        <SpinnerMini />
                        <LoadingText>
                            Verifying your recovery link...
                        </LoadingText>
                    </LoadingContainer>
                </ErrorContainer>
            </StyledUpdatePassword>
        );
    }

    // Error state - invalid or expired token
    if (isValidSession === false) {
        const errorMessages = {
            expired: {
                title: "Link Expired",
                text: "This password recovery link has expired. Recovery links are only valid for a limited time. Please request a new one to reset your password.",
            },
            invalid: {
                title: "Invalid Link",
                text: "This password recovery link is invalid or has already been used. Please request a new recovery link to reset your password.",
            },
            access_denied: {
                title: "Access Denied",
                text: "The recovery link is invalid or has expired. This can happen if the link was already used or if too much time has passed. Please request a new recovery link.",
            },
            "no-session": {
                title: "Session Not Found",
                text: "We couldn't verify your recovery session. This may happen if the link was incomplete or has expired. Please request a new recovery link.",
            },
        };

        const { title, text } =
            errorMessages[errorType] || errorMessages.invalid;

        return (
            <StyledUpdatePassword>
                <ErrorContainer>
                    <ErrorIcon>
                        <HiOutlineExclamationCircle />
                    </ErrorIcon>
                    <ErrorTitle>{title}</ErrorTitle>
                    <ErrorText>{text}</ErrorText>
                    <ErrorButtons>
                        <StyledButton
                            $variation="primary"
                            onClick={() => navigate("/recovery")}
                        >
                            <HiOutlineArrowPath />
                            Request New Recovery Link
                        </StyledButton>
                        <StyledButton
                            $variation="secondary"
                            onClick={() => navigate("/login")}
                        >
                            <HiOutlineArrowRightOnRectangle />
                            Back to Sign In
                        </StyledButton>
                    </ErrorButtons>
                    <LinkStyled to="/">Go to Homepage</LinkStyled>
                </ErrorContainer>
            </StyledUpdatePassword>
        );
    }

    // Valid session - show update password form
    return (
        <StyledUpdatePassword>
            <UpdatePasswordForm />
        </StyledUpdatePassword>
    );
}

export default UpdatePassword;
