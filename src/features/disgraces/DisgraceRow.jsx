import styled from "styled-components";
import Table from "../../ui/Table";
import { format } from "date-fns";
import Avatar from "../../ui/Avatar";

const Name = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-size: 1.6rem;
    font-weight: 400;
    color: var(--color-grey-600);
`;

const Stat = styled.div`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 500;
`;

function DisgraceRow({ disgrace }) {
    const winner =
        disgrace.scoreTeam1 === 0 ? disgrace.player2 : disgrace.player1;
    const loser =
        disgrace.scoreTeam1 === 0 ? disgrace.player1 : disgrace.player2;

    return (
        <Table.Row>
            <Name>
                <Avatar $size="xs" src={loser.avatar} />
                <span>{loser.name}</span>
            </Name>

            <Name>
                <Avatar $size="xs" src={winner.avatar} />
                <span>{winner.name}</span>
            </Name>

            <Stat>
                <span>{format(new Date(disgrace.end_time), "dd.MM.yyyy")}</span>
            </Stat>
        </Table.Row>
    );
}

export default DisgraceRow;
