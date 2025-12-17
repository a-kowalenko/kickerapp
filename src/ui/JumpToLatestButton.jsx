import styled from "styled-components";

const JumpToLatestButton = styled.button`
    position: absolute;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    padding: 0;
    background-color: var(--primary-button-color);
    color: var(--primary-button-color-text);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
    transition: all 0.2s;
    z-index: 10;

    &:hover {
        background-color: var(--primary-button-color-hover);
        transform: scale(1.1);
    }

    & svg {
        font-size: 2rem;
    }
`;

export default JumpToLatestButton;
