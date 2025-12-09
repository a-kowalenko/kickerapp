import styled, { css } from "styled-components";
import { media } from "../utils/constants";

const Input = styled.input`
    border-radius: var(--border-radius-sm);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.361);
    border: 1px solid var(--primary-input-border-color);
    padding: 1.2rem 2.4rem;
    outline: none;
    transition: none;
    width: 100%;

    ${media.mobile} {
        padding: 1rem 1.2rem;
        font-size: 1.4rem;
    }

    &:disabled {
        background-color: var(--disabled-color);
    }

    &:focus:not(:disabled),
    &:active:not(:disabled) {
        /* outline-style: double; */
        border-color: var(--primary-input-border-color-active);
    }

    ${(props) => variations[props.$variation]}
`;

const variations = {
    default: css`
        --color-input-field: var(--primary-input-background-color);
        --color-input-field-hover: var(--primary-input-background-color-hover);
        background-color: var(--color-input-field);

        &:hover:not(:disabled) {
            background-color: var(--color-input-field-hover);
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.727);
        }

        &:focus,
        &:active {
        }
    `,
    error: css`
        --color-input-field: var(--error-input-background-color);
        --color-input-field-hover: var(--error-input-background-color-hover);
        background-color: var(--color-input-field);
        border: 1px solid var(--error-input-border-color);

        &:hover:not(:disabled) {
            background-color: var(--color-input-field-hover);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.727);
        }

        &:focus,
        &:active {
            background-color: var(--color-input-field-hover);
        }
    `,
};

Input.defaultProps = {
    $variation: "default",
};

export default Input;
