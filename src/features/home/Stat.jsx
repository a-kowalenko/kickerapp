import styled from "styled-components";
import ContentBox from "../../ui/ContentBox";
import Heading from "../../ui/Heading";

const StyledStat = styled(ContentBox)`
    padding: 1.6rem;
    display: grid;
    grid-template-columns: 6.4rem 1fr;
    grid-template-rows: auto auto;
    column-gap: 1.6rem;
    row-gap: 0.4rem;
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
`;

const Title = styled(Heading)`
    align-self: end;
    font-size: 1.4rem;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--color-grey-600);
`;

const Value = styled.p`
    font-weight: 600;
    font-size: 2.4rem;
    line-height: 1;
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
