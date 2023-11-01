import { HiOutlinePlusCircle } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import Button from "../../ui/Button";
import styled from "styled-components";

const StyledNewMatchButton = styled(Button)`
    /* font-size: 1.6rem; */
    /* & svg {
        font-size: 3.6rem;
    } */
`;

function NewMatchButton() {
    const navigate = useNavigate();
    return (
        <StyledNewMatchButton
            $size="xlarge"
            onClick={() => navigate("/matches/create")}
        >
            <HiOutlinePlusCircle />
            New Match
        </StyledNewMatchButton>
    );
}

export default NewMatchButton;
