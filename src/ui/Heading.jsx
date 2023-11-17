import styled, { css } from "styled-components";
import { useMoveBack } from "../hooks/useMoveBack";
import ButtonIcon from "./ButtonIcon";
import { HiArrowLeft } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";

const StyledHeading = styled.h1`
    display: flex;
    justify-content: space-between;
    align-items: center;

    ${(props) =>
        props.as === "h1" &&
        css`
            font-size: 3rem;
            font-weight: 600;
            margin-bottom: 1rem;
        `}

    ${(props) =>
        props.as === "h2" &&
        css`
            font-size: 2rem;
            font-weight: 600;
        `}

    ${(props) =>
        props.as === "h3" &&
        css`
            font-size: 2rem;
            font-weight: 500;
        `}
    ${(props) =>
        props.type === "page" &&
        css`
            text-transform: uppercase;
            margin-bottom: unset;
        `}

    ${(props) => (props.$uppercase ? "text-transform: uppercase" : "")};

    line-height: 1.4;
`;

function Heading({
    as,
    type,
    hasBackBtn = false,
    backDirection = null,
    children,
}) {
    const moveBack = useMoveBack();
    const navigate = useNavigate();

    return (
        <StyledHeading as={as} type={type}>
            {children}
            {hasBackBtn && (
                <ButtonIcon
                    onClick={
                        backDirection ? () => navigate(backDirection) : moveBack
                    }
                >
                    <HiArrowLeft />
                </ButtonIcon>
            )}
        </StyledHeading>
    );
}

export default Heading;
