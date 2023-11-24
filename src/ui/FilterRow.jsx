import styled from "styled-components";
import { media } from "../utils/constants";

const FilterRow = styled.div`
    display: flex;
    align-items: center;
    margin: 0 0 1rem 0;

    ${media.tablet} {
        margin-left: 2.4rem;
    }
`;

export default FilterRow;
