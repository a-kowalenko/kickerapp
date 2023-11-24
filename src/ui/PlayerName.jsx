import { Link } from "react-router-dom";
import styled from "styled-components";
import { media } from "../utils/constants";

const PlayerName = styled(Link)`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-size: 1.6rem;
    font-weight: 400;
    width: fit-content;
    border-radius: var(--border-radius-sm);

    background: linear-gradient(
            0deg,
            var(--name-hover-gradient-start),
            var(--name-hover-gradient-end)
        )
        no-repeat right bottom / 0 var(--bg-h);
    transition: background-size 350ms;
    --bg-h: 100%;

    padding-bottom: 2px;
    --bg-h: 2px;

    &:hover {
        background-size: 100% var(--bg-h);
        background-position-x: left;
    }

    ${media.tablet} {
        font-size: 1.4rem;
        font-weight: 500;
        gap: 0.4rem;
    }
`;

export default PlayerName;
