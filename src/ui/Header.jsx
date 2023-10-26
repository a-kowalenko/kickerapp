import styled from "styled-components";

const StyledHeader = styled.header`
    background-color: var(--color-amber-75);
    padding: 1.6rem 4.8rem;
    border-bottom: 1px solid var(--color-amber-100);
`;

function Header() {
    return <StyledHeader>Header</StyledHeader>;
}

export default Header;
