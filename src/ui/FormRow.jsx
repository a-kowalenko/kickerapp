import styled from "styled-components";

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
`;

const StyledLabel = styled.label`
    font-size: 2rem;
`;

function FormRow({
    label,
    error,
    children,
    buttonPosition = "end",
    fill = false,
}) {
    return (
        <StyledFormRow
            $hasError={error}
            $buttonPosition={buttonPosition}
            $fill={fill}
        >
            {label && <StyledLabel>{label}</StyledLabel>}
            {children}
            {error && <label>{error}</label>}
        </StyledFormRow>
    );
}

export default FormRow;
