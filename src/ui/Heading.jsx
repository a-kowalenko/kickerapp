import styled, { css } from "styled-components";
import ButtonIcon from "./ButtonIcon";
import { HiArrowLeft } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { media } from "../utils/constants";
import { useMoveBackToHome } from "../hooks/useMoveBackToHome";

const StyledHeading = styled.h1`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 2.4rem;

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

    ${media.tablet} {
        padding: 0 2.4rem;
    }
`;

function Heading({
    as,
    type,
    hasBackBtn = false,
    backDirection = null,
    children,
}) {
    const moveBackToHome = useMoveBackToHome();
    const navigate = useNavigate();

    return (
        <StyledHeading as={as} type={type}>
            {hasBackBtn && (
                <ButtonIcon
                    onClick={
                        backDirection
                            ? () => navigate(backDirection)
                            : moveBackToHome
                    }
                >
                    <HiArrowLeft />
                </ButtonIcon>
            )}
            {children}
        </StyledHeading>
    );
}

export default Heading;
