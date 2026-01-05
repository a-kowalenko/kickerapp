import Filter from "../../ui/Filter";
import { PiGameControllerLight } from "react-icons/pi";
import FilterRow from "../../ui/FilterRow";

function ProfileStatisticsFilterRow() {
    const gamemodeOptions = [
        { text: "1on1", value: "1on1" },
        { text: "2on2", value: "2on2" },
        { text: "Team", value: "team" },
    ];

    return (
        <FilterRow>
            <Filter
                name="profile-statistics"
                options={gamemodeOptions}
                field="gamemode"
                icon={<PiGameControllerLight />}
            />
        </FilterRow>
    );
}

export default ProfileStatisticsFilterRow;
