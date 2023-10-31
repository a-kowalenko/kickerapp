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
    return (
        <MiniTable.Row>
            <Name to={`/user/${disgrace.player1.name}/profile`}>
                {disgrace.player1.name}
            </Name>
            <Name to={`/user/${disgrace.player2.name}/profile`}>
                {disgrace.player2.name}
            </Name>
            <div>{format(new Date(disgrace.end_time), "dd.")}</div>
        </MiniTable.Row>
    );
}

export default MiniDisgraceRow;
