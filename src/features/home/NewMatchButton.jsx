import { HiOutlinePlusCircle } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import styled from "styled-components";

const StyledNewMatchButton = styled(Button)`
    white-space: nowrap;
    gap: 1rem;
    padding: 1.2rem 1.6rem;
    width: 100%;
`;

function NewMatchButton() {
    const navigate = useNavigate();
    return (
        <StyledNewMatchButton
            $size="xlarge"
            onClick={() => navigate("/matches/create")}
        >
            <HiOutlinePlusCircle />
            <span>New Match</span>
        </StyledNewMatchButton>
    );
}

export default NewMatchButton;
