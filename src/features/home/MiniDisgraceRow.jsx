import { format } from "date-fns";
import MiniTable from "../../ui/MiniTable";

function MiniDisgraceRow({ disgrace }) {
    return (
        <MiniTable.Row>
            <div>{disgrace.player1.name}</div>
            <div>{disgrace.player2.name}</div>
            <div>{format(new Date(disgrace.end_time), "dd.")}</div>
        </MiniTable.Row>
    );
}

export default MiniDisgraceRow;
