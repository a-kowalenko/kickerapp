import styled from "styled-components";
import MainNav from "./MainNav";
import Logo from "./Logo";
import { media } from "../utils/constants";
import BurgerMenu from "./BurgerMenu";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

const StyledSidebar = styled.aside`
    display: flex;
    flex-direction: column;
    padding: 1.2rem 2.4rem;
    background-color: var(--primary-background-color);
    grid-row: 1 / -1;
    border-right: 1px solid var(--secondary-border-color);
    transition: width 0.2s ease-out; // Hinzufügen von Transitions
    width: 22rem;

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
                    margin-top: 5rem;
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

    ${media.tablet} {
        display: none;
    }
`;

function Sidebar() {
    const [isOpen, setIsOpen] = useLocalStorageState(true, "isOpenLeftSidebar");

    const toggleSidebar = () => setIsOpen((open) => !open);

    console.log(isOpen);

    return (
        <>
            <BurgerMenu onClick={toggleSidebar} />
            <StyledSidebar $isOpen={isOpen}>
                <Logo />
                <MainNav />
            </StyledSidebar>
        </>
    );
}

export default Sidebar;
