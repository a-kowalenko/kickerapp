import styled from "styled-components";
import { media } from "../utils/constants";

const StyledLabel = styled.label`
    font-size: 2rem;

    ${media.tablet} {
        font-size: 1.6rem;
    }

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

function Label({ children }) {
    return <StyledLabel>{children}</StyledLabel>;
}

export default Label;
