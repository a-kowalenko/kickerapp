import styled from "styled-components";
import DarkModeToggle from "./DarkModeToggle";

const StyledHeader = styled.header`
    background-color: var(--primary-background-color);
    padding: 1.6rem 4.8rem;
    border-bottom: 1px solid var(--secondary-border-color);

    display: flex;
    gap: 2.4rem;
    align-items: center;
    justify-content: flex-end;
`;

function Header() {
    return (
        <StyledHeader>
            <DarkModeToggle />
        </StyledHeader>
    );
}

export default Header;
