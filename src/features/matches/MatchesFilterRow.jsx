import Filter from "../../ui/Filter";
import { PiGameControllerLight } from "react-icons/pi";
import FilterRow from "../../ui/FilterRow";

function MatchesFilterRow() {
    const options = [
        { text: "All", value: "all" },
        { text: "1on1", value: "1on1" },
        { text: "2on2", value: "2on2" },
        { text: "2on1", value: "2on1" },
    ];
    const field = "gamemode";

    return (
        <FilterRow>
            <Filter
                name="matches"
                options={options}
                field={field}
                icon={<PiGameControllerLight />}
            />
        </FilterRow>
    );
}

export default MatchesFilterRow;
