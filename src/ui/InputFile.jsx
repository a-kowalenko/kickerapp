import styled from "styled-components";

const InputFile = styled.input.attrs({ type: "file" })`
    border-radius: var(--border-radius-sm);
    padding: 1.2rem 2.4rem 1.2rem 0;

    &::file-selector-button {
        cursor: pointer;
        margin-right: 2rem;
        border-radius: var(--border-radius-sm);
        box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);
        transition: box-shadow 0.2s ease-in-out;

        &:hover {
            box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.7);
        }

        &:active {
            box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.7);
        }

        padding: 0.6rem 1.2rem;
        font-weight: 500;
        font-size: 1.6rem;

        color: #000000;
        border: 1px solid rgb(235, 202, 33);
        background-color: rgb(235, 202, 33);

        &:active {
            border: 1px solid rgb(199, 168, 11);
            background-color: rgb(199, 168, 11);
        }
    }

    &::file-selector-label {
        color: red;
    }
`;

export default InputFile;
