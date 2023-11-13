import styled from "styled-components";

const ButtonIcon = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    padding: 0.6rem;
    border-radius: var(--border-radius-sm);
    transition: all 0.2s;

    &:hover {
        background-color: var(--primary-button-color-hover);
    }

    & svg {
        width: 2.2rem;
        height: 2.2rem;
        color: var(--primary-button-color-text);
    }
`;

export default ButtonIcon;
