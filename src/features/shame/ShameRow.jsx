import styled from "styled-components";
import Table from "../../ui/Table";
import { format } from "date-fns";

const Rank = styled.div`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-grey-600);
    text-align: center;
`;

const Name = styled.div`
    font-size: 1.6rem;
    font-weight: 400;
    color: var(--color-grey-600);
`;

const Stat = styled.div`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 500;
`;

function ShameRow({ shame }) {
    return (
        <Table.Row>
            <Name>
                <span>{shame.player}</span>
            </Name>

            <Name>
                <span>{shame.shamedBy}</span>
            </Name>

            <Stat>
                <span>{format(shame.date, "dd.MM.yyyy")}</span>
            </Stat>
        </Table.Row>
    );
}

export default ShameRow;
