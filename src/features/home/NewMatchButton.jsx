import { HiOutlinePlusCircle } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

const StyledNewMatch = styled.button`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    background-color: var(--color-amber-100);
    border: none;
    font-size: 2.8rem;

    padding: 2.8rem 3.8rem;
    border-radius: var(--border-radius-lg);

    &:hover {
        background-color: var(--color-amber-200);
    }

    svg {
        font-size: 3.2rem;
    }
`;

function NewMatchButton() {
    const navigate = useNavigate();
    return (
        <StyledNewMatch onClick={() => navigate("/matches/create")}>
            <HiOutlinePlusCircle />
            <span>New Match</span>
        </StyledNewMatch>
    );
}

export default NewMatchButton;
