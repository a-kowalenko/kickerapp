import styled from "styled-components";
import ButtonIcon from "./ButtonIcon";
import { HiArrowLeft } from "react-icons/hi2";
import { useMoveBack } from "../hooks/useMoveBack";

const StyledError = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const ErrorMessage = styled.div`
    padding: 1.2rem 2.4rem;
    &:before {
        content: "⚠️";
        display: inline-block;
        margin-right: 10px;
    }
`;

function Error({ message }) {
    const moveBack = useMoveBack();

    return (
        <StyledError>
            <ErrorMessage>{message}</ErrorMessage>
            <ButtonIcon onClick={moveBack} title="Go back">
                <HiArrowLeft />
            </ButtonIcon>
        </StyledError>
    );
}

export default Error;
