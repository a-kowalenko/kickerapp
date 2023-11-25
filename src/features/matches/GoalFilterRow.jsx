import Filter from "../../ui/Filter";
import { HiArrowsUpDown } from "react-icons/hi2";
import FilterRow from "../../ui/FilterRow";

function GoalsFilterRow() {
    const options = [
        { text: "Ascending", value: "asc" },
        { text: "Descending", value: "desc" },
    ];
    const field = "sort";

    return (
        <FilterRow>
            <Filter
                name="goals"
                options={options}
                field={field}
                icon={<HiArrowsUpDown />}
            />
        </FilterRow>
    );
}

export default GoalsFilterRow;
