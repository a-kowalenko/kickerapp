import { format } from "date-fns";
import MiniTable from "../../ui/MiniTable";
import styled from "styled-components";
import { Link } from "react-router-dom";

const Name = styled(Link)`
    display: flex;
    gap: 0.8rem;
    font-size: 1.6rem;
    font-weight: 400;
    width: fit-content;
`;

function MiniDisgraceRow({ disgrace }) {
    const winner =
        disgrace.scoreTeam1 === 0 ? disgrace.player2 : disgrace.player1;
    const loser =
        disgrace.scoreTeam1 === 0 ? disgrace.player1 : disgrace.player2;

    console.log("lol", disgrace);

    return (
        <MiniTable.Row>
            <Name to={`/user/${loser.name}/profile`}>{loser.name}</Name>
            <Name to={`/user/${winner.name}/profile`}>{winner.name}</Name>
            <div>{format(new Date(disgrace.end_time), "dd.")}</div>
        </MiniTable.Row>
    );
}

export default MiniDisgraceRow;
