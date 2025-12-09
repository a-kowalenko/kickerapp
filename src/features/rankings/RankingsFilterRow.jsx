import Filter from "../../ui/Filter";
import { PiGameControllerLight } from "react-icons/pi";
import FilterRow from "../../ui/FilterRow";

function RankingsFilterRow() {
    const options = [
        { text: "1on1", value: "1on1" },
        { text: "2on2", value: "2on2" },
    ];

    const field = "gamemode";

    return (
        <FilterRow>
            <Filter
                name="rankings"
                options={options}
                field={field}
                icon={<PiGameControllerLight />}
            />
        </FilterRow>
    );
}

export default RankingsFilterRow;
