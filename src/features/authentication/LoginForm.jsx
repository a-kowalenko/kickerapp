import { useState } from "react";
import { useLogin } from "./useLogin";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, isLoading, error } = useLogin();
    const navigate = useNavigate();

    function handleSubmit() {
        if (!email || !password) {
            return toast.error(
                "We couldn't verify your account with that information."
            );
        }

        login({ email, password });
    }

    return (
        <div>
            <div>
                <label>email</label>
                <input
                    value={email}
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email"
                    disabled={isLoading}
                />
            </div>
            <div>
                <label>password</label>
                <input
                    value={password}
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="password"
                    disabled={isLoading}
                />
            </div>
            <div>
                <button onClick={handleSubmit} disabled={isLoading}>
                    Login
                </button>
                <div>
                    <label>No account?</label>
                    <button onClick={() => navigate("/register")}>
                        Register
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginForm;
