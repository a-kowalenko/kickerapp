import { Link } from "react-router-dom";
import styled from "styled-components";

const PlayerName = styled(Link)`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-size: 1.6rem;
    font-weight: 400;
    width: fit-content;
    border-radius: var(--border-radius-sm);

    background: linear-gradient(0deg, #cdc55a, #fd7a00) no-repeat right bottom /
        0 var(--bg-h);
    transition: background-size 350ms;
    --bg-h: 100%;

    padding-bottom: 2px;
    --bg-h: 2px;

    &:hover {
        background-size: 100% var(--bg-h);
        background-position-x: left;
    }
`;

export default PlayerName;
