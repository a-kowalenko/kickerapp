import styled, { css } from "styled-components";

const Button = styled.button`
    border-radius: var(--border-radius-sm);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.361);

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
        color: #000000;
        border: 1px solid rgb(235, 202, 33);
        background-color: rgb(235, 202, 33);

        &:hover {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.727);
        }

        &:active {
            border: 1px solid rgb(199, 168, 11);
            background-color: rgb(199, 168, 11);
        }
    `,
    secondary: css`
        --color-secondary-button: rgb(217, 217, 217);
        --color-secondary-button-active: rgb(188, 188, 188);

        color: #000000;
        border: 1px solid var(--color-secondary-button);
        background-color: var(--color-secondary-button);

        &:hover {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.727);
        }

        &:active {
            border: 1px solid var(--color-secondary-button-active);
            background-color: var(--color-secondary-button-active);
        }
    `,
    danger: css`
        --color-danger-button: rgb(214, 19, 19);
        --color-danger-button1: rgb(185, 28, 28);
        --color-danger-button-active: rgb(255, 72, 72);

        color: #ffffff;
        border: 1px solid var(--color-danger-button);
        background-color: var(--color-danger-button);

        &:hover {
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.727);
        }

        &:active {
            border: 1px solid var(--color-danger-button-active);
            background-color: var(--color-danger-button-active);
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
};

Button.defaultProps = {
    $size: "medium",
    $variation: "primary",
};

export default Button;
