import styled from "styled-components";
import MainNav from "./MainNav";
import Logo from "./Logo";

const StyledSidebar = styled.aside`
    display: flex;
    flex-direction: column;
    padding: 1.2rem 2.4rem;
    background-color: var(--primary-background-color);
    grid-row: 1 / -1;
    border-right: 1px solid var(--secondary-border-color);
`;

function Sidebar() {
    return (
        <StyledSidebar>
            <Logo />
            <MainNav />
        </StyledSidebar>
    );
}

export default Sidebar;
