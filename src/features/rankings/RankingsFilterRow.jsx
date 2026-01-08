import { useSearchParams } from "react-router-dom";
import Filter from "../../ui/Filter";
import { PiGameControllerLight } from "react-icons/pi";
import { HiOutlineUsers, HiOutlineUserGroup } from "react-icons/hi2";
import FilterRow from "../../ui/FilterRow";

function RankingsFilterRow() {
    const [searchParams] = useSearchParams();
    const tab = searchParams.get("tab") || "players";

    const tabOptions = [
        { text: "Players", value: "players" },
        { text: "Teams", value: "teams" },
    ];

    const gamemodeOptions = [
        { text: "1on1", value: "1on1" },
        { text: "2on2", value: "2on2" },
    ];

    return (
        <FilterRow>
            <Filter
                name="rankings-tab"
                options={tabOptions}
                field="tab"
                icon={<HiOutlineUsers />}
            />
            {tab === "players" && (
                <Filter
                    name="rankings"
                    options={gamemodeOptions}
                    field="gamemode"
                    icon={<PiGameControllerLight />}
                />
            )}
        </FilterRow>
    );
}

export default RankingsFilterRow;
