import styled, { css } from "styled-components";

const Input = styled.input`
    border-radius: var(--border-radius-sm);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.361);
    border: 1px solid black;
    padding: 1.2rem 2.4rem;

    &:disabled {
        background-color: var(--color-grey-300);
    }

    &:focus:not(:disabled),
    &:active:not(:disabled) {
        outline-style: double;
    }

    ${(props) => variations[props.$variation]}
`;

const variations = {
    default: css`
        --color-input-field: #fddf335f;
        --color-input-field-hover: #ffffff9a;
        background-color: var(--color-input-field);

        &:hover:not(:disabled) {
            background-color: var(--color-input-field-hover);
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.727);
        }

        &:focus,
        &:active {
            background-color: var(--color-input-field-hover);
        }
    `,
    error: css`
        --color-input-field-hover: #ffa5a529;
        --color-input-field: #ffb6b69a;
        background-color: var(--color-input-field);
        border: 1px solid #ff0000;

        &:hover:not(:disabled) {
            background-color: var(--color-input-field-hover);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.727);
        }

        &:focus,
        &:active {
            outline-color: #ff0000;
            background-color: var(--color-input-field-hover);
        }
    `,
};

Input.defaultProps = {
    $variation: "default",
};

export default Input;
