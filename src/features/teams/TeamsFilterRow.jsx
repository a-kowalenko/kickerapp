import { useSearchParams } from "react-router-dom";
import Filter from "../../ui/Filter";
import FilterRow from "../../ui/FilterRow";
import { HiOutlineUserGroup } from "react-icons/hi2";

function TeamsFilterRow({ myActiveCount, isLoading }) {
    const [searchParams] = useSearchParams();
    const currentFilter = searchParams.get("filter") || "my";

    const options = [
        {
            text: `My Teams${!isLoading ? ` (${myActiveCount})` : ""}`,
            value: "my",
        },
        { text: "All Teams", value: "all" },
        { text: "Dissolved", value: "dissolved" },
    ];

    return (
        <FilterRow>
            <Filter
                name="teams"
                options={options}
                field="filter"
                icon={<HiOutlineUserGroup />}
            />
        </FilterRow>
    );
}

export default TeamsFilterRow;
