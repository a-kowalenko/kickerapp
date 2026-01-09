import styled from "styled-components";
import ContentBox from "../../ui/ContentBox";
import Heading from "../../ui/Heading";
import { media } from "../../utils/constants";

const StyledStat = styled(ContentBox)`
    padding: 1.6rem;
    display: grid;
    grid-template-columns: 6.4rem 1fr;
    grid-template-rows: auto auto;
    column-gap: 1.6rem;
    row-gap: 0.4rem;

    ${media.tablet} {
        column-gap: 1rem;
    }
`;

const Icon = styled.div`
    grid-row: 1 / -1;
    aspect-ratio: 1;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-${(props) => props.color}-100);

    & svg {
        width: 3.2rem;
        height: 3.2rem;
        color: var(--color-${(props) => props.color}-700);
    }

    ${media.tablet} {
        & svg {
            width: 2.4rem;
            height: 2.4rem;
        }
    }
`;

const Title = styled(Heading)`
    align-self: end;
    font-size: 1.4rem;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--color-grey-600);

    ${media.tablet} {
        font-size: 1.2rem;
    }

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const Value = styled.p`
    font-weight: 600;
    font-size: 2.4rem;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: wrap;
    min-width: 0;

    ${media.tablet} {
        font-size: 2rem;
    }

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

function Stat({ icon, title, value, color }) {
    return (
        <StyledStat>
            <Icon color={color}>{icon}</Icon>
            <Title as="h3">{title}</Title>
            <Value>{value}</Value>
        </StyledStat>
    );
}

export default Stat;
