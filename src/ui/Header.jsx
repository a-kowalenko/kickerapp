import styled from "styled-components";
import ProfileMenu from "./ProfileMenu";

const StyledHeader = styled.header`
    background-color: var(--color-amber-75);
    padding: 1.6rem 4.8rem;
    border-bottom: 1px solid var(--color-amber-100);

    display: flex;
    gap: 2.4rem;
    align-items: center;
    justify-content: flex-end;
`;

function Header() {
    return <StyledHeader>Header</StyledHeader>;
}

export default Header;
