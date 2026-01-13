import styled from "styled-components";

const SectionTitle = styled.h3`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--primary-text-color);

    display: flex;
    align-items: center;
    gap: 0.8rem;

    & svg {
        font-size: 1.8rem;
        color: var(--primary-button-color);
    }
`;

export default SectionTitle;
