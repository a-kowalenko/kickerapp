import { FaBars } from "react-icons/fa";
import ButtonIcon from "./ButtonIcon";
import styled from "styled-components";

const BurgerMenuContainer = styled.div`
    display: flex;
    position: absolute;
    left: 1rem;
    top: 0.5rem;
    gap: 1rem;
`;

function BurgerMenu({ onClick }) {
    return (
        <BurgerMenuContainer>
            <ButtonIcon onClick={onClick}>
                <FaBars />
            </ButtonIcon>
        </BurgerMenuContainer>
    );
}

export default BurgerMenu;
