import FilterRow from "../../ui/FilterRow";
import SeasonFilter from "../seasons/SeasonFilter";

function StatsFilterRow() {
    return (
        <FilterRow>
            <SeasonFilter name="stats" defaultToCurrent={true} />
        </FilterRow>
    );
}

export default StatsFilterRow;
