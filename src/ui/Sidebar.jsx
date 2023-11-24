import styled from "styled-components";
import MainNav from "./MainNav";
import Logo from "./Logo";
import BurgerMenu from "./BurgerMenu";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { useOutsideClick } from "../hooks/useOutsideClick";
import { isTouchDevice } from "../utils/helpers";
import useWindowWidth from "../hooks/useWindowWidth";

const StyledSidebar = styled.aside`
    display: flex;
    flex-direction: column;
    padding: 1.2rem 2.4rem;
    background-color: var(--primary-background-color);
    grid-row: 1 / -1;
    border-right: 1px solid var(--secondary-border-color);
    transition: width 0.2s ease-out; // Hinzufügen von Transitions
    width: 24rem;

    @media (max-width: 850px) {
        &.active {
            left: 0;
        }
    }

    @media (min-width: 851px) {
        ${(props) =>
            props.$isOpen
                ? `
                & img {
                    transition: height 0.3s ease-out, margin-top 0.3s ease-out;
                }
            `
                : `
                width: 6rem; 
                padding: 0px;
                
                & img {
                    height: 6rem;
                    margin-top: 6rem;
                }

                & span {
                    display: none;
                }
                & a {
                    justify-content: center;
                }
                & a:link, & a:visited {
                    padding: 1.2rem 1.2rem;
                }
        `}
    }

    @media (max-width: 850px) {
        position: fixed;
        top: 0;
        bottom: 0;
        left: -100%;
        width: 25rem;
        z-index: 100;
        transition: left 0.3s ease-in-out;
    }
`;

function Sidebar() {
    const { isDesktop } = useWindowWidth();
    const [isOpen, setIsOpen] = useLocalStorageState(
        isDesktop,
        "isOpenLeftSidebar"
    );

    const close = () => {
        if (isTouchDevice()) {
            setIsOpen(false);
        }
    };

    const sidebarRef = useOutsideClick(close, false);

    const toggleSidebar = (e) => {
        e.stopPropagation();
        setIsOpen((open) => !open);
    };

    return (
        <>
            <BurgerMenu onClick={toggleSidebar} />
            <StyledSidebar
                ref={sidebarRef}
                className={isOpen ? "active" : ""}
                $isOpen={isOpen}
            >
                <Logo />
                <MainNav close={close} />
            </StyledSidebar>
        </>
    );
}

export default Sidebar;
