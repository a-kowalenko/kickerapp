import styled from "styled-components";

const StyledFormRow = styled.div`
    display: grid;
    align-items: center;
    grid-template-columns: 24rem 1fr 1.2fr;
    gap: 2.4rem;
    padding: 1.2rem 0;
`;

function FormRow({ label, error, children }) {
    return (
        <StyledFormRow>
            {label && <label>{label}</label>}
            {children}
            {error && <label>{error}</label>}
        </StyledFormRow>
    );
}

export default FormRow;
