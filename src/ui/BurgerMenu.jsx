import { FaBars } from "react-icons/fa";
import ButtonIcon from "./ButtonIcon";
import styled from "styled-components";

const BurgerMenuContainer = styled.div`
    display: flex;
    position: fixed;
    left: 1.5rem;
    top: 1.6rem;
    gap: 1rem;
    z-index: 1000;

    @media (max-width: 850px) {
        display: flex;
        position: fixed;
        left: 1.5rem;
        top: 1.6rem;
        gap: 1rem;
        z-index: 1000;
        transform: translateY(
            ${(props) => (props.$isHeaderVisible ? "0" : "-100px")}
        );
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
`;

function BurgerMenu({ onClick, isHeaderVisible = true }) {
    return (
        <BurgerMenuContainer $isHeaderVisible={isHeaderVisible}>
            <ButtonIcon onClick={onClick}>
                <FaBars />
            </ButtonIcon>
        </BurgerMenuContainer>
    );
}

export default BurgerMenu;
