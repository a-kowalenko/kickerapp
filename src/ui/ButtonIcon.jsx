import styled, { css } from "styled-components";

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
        ${(props) => (props.$size ? sizes[props.$size] : sizes.default)}
        ${(props) =>
            props.$variation
                ? variations[props.$variation]
                : variations.default}
    }
`;

const variations = {
    default: css`
        color: var(--primary-button-color-text);
    `,
    primary: css`
        /* background-color: var(--primary-button-color-hover); */
        /* color: var(--primary-button-color); */
    `,
    danger: css`
        color: var(--danger-button-color);
    `,
    success: css`
        color: var(--winner-name-color);
    `,
};

const sizes = {
    default: css`
        width: 2.2rem;
        height: 2.2rem;
    `,
    large: css`
        width: 3.6rem;
        height: 3.6rem;
    `,
    xlarge: css`
        width: 4.8rem;
        height: 4.8rem;
    `,
    xxlarge: css`
        width: 6rem;
        height: 6rem;
    `,
};

export default ButtonIcon;
