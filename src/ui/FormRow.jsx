import styled from "styled-components";
import { media } from "../utils/constants";

const StyledFormRow = styled.div`
    display: grid;
    align-items: center;
    grid-template-columns: ${(props) =>
        props.$hasError ? "24rem 1fr 1.2fr" : "28rem 1fr"};
    gap: 2.4rem;
    padding: 1.2rem 0;

    &:has(button) {
        ${(props) => (props.$fill ? "" : "display: flex")};
        justify-content: ${(props) =>
            props.$buttonPosition === "end" ? "flex-end" : "flex-start"};
        gap: 1.2rem;
        width: inherit;
    }

    ${media.tablet} {
        grid-template-columns: ${(props) =>
            props.$hasError ? "16rem 1fr" : "16rem 1fr"};
        gap: 1.6rem;
        padding: 1rem 0;
    }

    ${media.mobile} {
        grid-template-columns: 1fr;
        gap: 1rem;
        padding: 0.8rem 0;
    }
`;

const StyledLabel = styled.label`
    font-size: 2rem;

    ${media.tablet} {
        font-size: 1.6rem;
    }

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

function FormRow({
    label,
    error,
    children,
    buttonPosition = "end",
    fill = false,
    element,
}) {
    return (
        <StyledFormRow
            $hasError={error}
            $buttonPosition={buttonPosition}
            $fill={fill}
        >
            {label && <StyledLabel>{label}</StyledLabel>}
            {children}
            {element && <label>{element}</label>}
            {error && <label>{error}</label>}
        </StyledFormRow>
    );
}

export default FormRow;
