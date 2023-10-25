import styled from "styled-components";

const StyledLogo = styled.div`
    text-align: center;
`;

const Img = styled.img`
    height: 12rem;
    width: auto;
`;

function Logo() {
    return (
        <StyledLogo>
            <Img src="/logo.png" alt="Logo" />
        </StyledLogo>
    );
}

export default Logo;
