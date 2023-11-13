import styled, { css } from "styled-components";

const Button = styled.button`
    border-radius: var(--border-radius-sm);
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);
    transition: box-shadow 0.2s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2.4rem;

    &:hover {
        box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.7);
    }

    &:active {
        box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.7);
    }

    ${(props) => {
        const size = props.$size;
        return sizes[size];
    }}

    ${(props) => {
        const variation = props.$variation;
        return variations[variation];
    }}
`;

const variations = {
    primary: css`
        color: var(--primary-button-color-text);
        border: 1px solid var(--primary-button-color);
        background-color: var(--primary-button-color);

        &:active {
            border: 1px solid var(--primary-button-color-active);
            background-color: var(--primary-button-color-active);
        }
    `,
    secondary: css`
        color: var(--secondary-button-color-text);
        border: 1px solid var(--secondary-button-color);
        background-color: var(--secondary-button-color);

        &:active {
            border: 1px solid var(--secondary-button-color-active);
            background-color: var(--secondary-button-color-active);
        }
    `,
    danger: css`
        color: var(--danger-button-color-text);
        border: 1px solid var(--danger-button-color);
        background-color: var(--danger-button-color);

        &:active {
            border: 1px solid var(--danger-button-color-active);
            background-color: var(--danger-button-color-active);
        }
    `,
};

const sizes = {
    small: css`
        padding: 0.3rem 0.6rem;
        font-weight: 600;
        font-size: 1.5rem;
    `,
    medium: css`
        padding: 0.6rem 1.2rem;
        font-weight: 500;
        font-size: 1.6rem;
    `,
    large: css`
        padding: 1.2rem 2.4rem;
        font-weight: 500;
        font-size: 1.6rem;
    `,
    xlarge: css`
        padding: 1.2rem 2.4rem;
        font-weight: 500;
        font-size: 1.8rem;

        & svg {
            font-size: 3.2rem;
        }
    `,
    huge: css`
        padding: 1.2rem 2.4rem;
        font-weight: 500;
        font-size: 3.2rem;
    `,
};

Button.defaultProps = {
    $size: "medium",
    $variation: "primary",
};

export default Button;
