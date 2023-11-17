import { useForm } from "react-hook-form";
import { useRegister } from "./useRegister";
import FormRow from "../../ui/FormRow";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import styled from "styled-components";
import StyledLink from "../../ui/StyledLink";
import SpinnerMini from "../../ui/SpinnerMini";

const RegisterContainer = styled.div`
    padding: 1.2rem 2.4rem;
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--primary-border-color);
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
`;

function RegisterForm() {
    const { register, isLoading, error } = useRegister();

    const {
        register: formRegister,
        formState,
        getValues,
        handleSubmit,
    } = useForm();

    function onSubmit({ username, email, password }) {
        register({ username, email, password });
    }

    return (
        <RegisterContainer>
            <form onSubmit={handleSubmit(onSubmit)}>
                <FormRow label="Username">
                    <Input
                        type="text"
                        id="username"
                        placeholder="username"
                        autoComplete="username"
                        disabled={isLoading}
                        {...formRegister("username", {
                            required: "The username is required",
                        })}
                    />
                </FormRow>

                <FormRow label="Email">
                    <Input
                        type="text"
                        id="email"
                        placeholder="email"
                        autoComplete="email"
                        disabled={isLoading}
                        {...formRegister("email", {
                            required: "The email is required",
                            pattern: {
                                value: /\S+@\S+\.\S+/,
                                message: "Please provide a valid email address",
                            },
                        })}
                    />
                </FormRow>

                <FormRow label="Password">
                    <Input
                        id="password"
                        type="password"
                        placeholder="password"
                        disabled={isLoading}
                        autoComplete="new-password"
                        {...formRegister("password", {
                            required: "The password is required",
                            minLength: {
                                value: 8,
                                message:
                                    "The password must be at least 8 characters long",
                            },
                        })}
                    />
                </FormRow>

                <FormRow label="Confirm password">
                    <Input
                        id="passwordConfirm"
                        type="password"
                        placeholder="confirm password"
                        disabled={isLoading}
                        autoComplete="new-password"
                        {...formRegister("passwordConfirm", {
                            required: "The password confirm is required",
                            validate: (value) =>
                                value === getValues().password ||
                                "Passwords need to match",
                        })}
                    />
                </FormRow>

                <FormRow fill={true}>
                    <Button $size="large" disabled={isLoading}>
                        {isLoading ? <SpinnerMini /> : "Register"}
                    </Button>
                </FormRow>

                <FormRow label="Already have an account?">
                    <StyledLink to="/login">Login</StyledLink>
                </FormRow>
            </form>
        </RegisterContainer>
    );
}

export default RegisterForm;
