import Filter from "../../ui/Filter";
import { GiBattleAxe } from "react-icons/gi";
import FilterRow from "../../ui/FilterRow";

function StatsFilterRow() {
    const options = [{ text: "Season 0", value: "0" }];
    const field = "season";

    return (
        <FilterRow>
            <Filter
                options={options}
                field={field}
                name="stats"
                icon={<GiBattleAxe />}
            />
        </FilterRow>
    );
}

export default StatsFilterRow;
