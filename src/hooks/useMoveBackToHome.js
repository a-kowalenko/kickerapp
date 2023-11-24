import { useNavigate } from "react-router-dom";

export function useMoveBackToHome() {
    const navigate = useNavigate();
    return () => navigate("/home");
}
