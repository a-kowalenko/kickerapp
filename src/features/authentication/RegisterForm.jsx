import { useForm } from "react-hook-form";
import { useRegister } from "./useRegister";

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
        <form onSubmit={handleSubmit(onSubmit)}>
            <div>
                <label>username</label>
                <input
                    type="text"
                    id="username"
                    placeholder="username"
                    disabled={isLoading}
                    {...formRegister("username", {
                        required: "The username is required",
                    })}
                />
            </div>

            <div>
                <label>email</label>
                <input
                    type="text"
                    id="email"
                    placeholder="email"
                    disabled={isLoading}
                    {...formRegister("email", {
                        required: "The email is required",
                        pattern: {
                            value: /\S+@\S+\.\S+/,
                            message: "Please provide a valid email address",
                        },
                    })}
                />
            </div>

            <div>
                <label>password</label>
                <input
                    id="password"
                    type="password"
                    disabled={isLoading}
                    {...formRegister("password", {
                        required: "The password is required",
                        minLength: {
                            value: 8,
                            message:
                                "The password must be at least 8 characters long",
                        },
                    })}
                />
            </div>

            <div>
                <label>confirm password</label>
                <input
                    id="passwordConfirm"
                    type="password"
                    disabled={isLoading}
                    {...formRegister("passwordConfirm", {
                        required: "The password confirm is required",
                        validate: (value) =>
                            value === getValues().password ||
                            "Passwords need to match",
                    })}
                />
            </div>

            <div>
                <button disabled={isLoading}>Register</button>
            </div>
        </form>
    );
}

export default RegisterForm;
