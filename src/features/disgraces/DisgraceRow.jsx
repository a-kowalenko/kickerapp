import styled from "styled-components";
import Table from "../../ui/Table";
import { format } from "date-fns";
import Avatar from "../../ui/Avatar";
import { Link } from "react-router-dom";

const Name = styled(Link)`
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
            <Name to={`/user/${loser.name}`}>
                <Avatar $size="xs" src={loser.avatar || "/default-user.jpg"} />
                <span>{loser.name}</span>
            </Name>

            <Name to={`/user/${winner.name}`}>
                <Avatar $size="xs" src={winner.avatar || "/default-user.jpg"} />
                <span>{winner.name}</span>
            </Name>

            <Stat>
                <span>{format(new Date(disgrace.end_time), "dd.MM.yyyy")}</span>
            </Stat>
        </Table.Row>
    );
}

export default DisgraceRow;
