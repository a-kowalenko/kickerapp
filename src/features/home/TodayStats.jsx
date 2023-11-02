import {
    HiArrowDownRight,
    HiArrowUpRight,
    HiOutlineClock,
} from "react-icons/hi2";
import { PiSoccerBallThin } from "react-icons/pi";
import Stat from "./Stat";
import { useTodayStats } from "./useTodayStats";
import { format } from "date-fns";
import Spinner from "../../ui/Spinner";

function getTeams(match) {
    const {
        mmrChangeTeam1,
        mmrChangeTeam2,
        player1,
        player2,
        player3,
        player4,
    } = match;
    const team1 = [player1, player3];
    const team2 = [player2, player4];

    return { team1, team2, mmrChangeTeam1, mmrChangeTeam2 };
}

function TodayStats() {
    const { matches, isLoading, count } = useTodayStats();

    if (isLoading) {
        return <Spinner />;
    }

    // 1. Today's matches
    const todaysMatches = count;

    // 2. Time wasted
    const timeWasted = format(
        matches
            .filter((match) => match.status === "ended")
            .reduce(
                (acc, cur) =>
                    acc + (new Date(cur.end_time) - new Date(cur.created_at)),
                0
            ),
        "mm:ss"
    );

    // 3. Today's top and flop
    const playerWithPoints = matches.reduce((acc, cur) => {
        const { team1, team2, mmrChangeTeam1, mmrChangeTeam2 } = getTeams(cur);
        let newState = {};
        for (const player of team1) {
            if (player) {
                newState = {
                    ...newState,
                    [player.name]: acc[player.name]
                        ? acc[player.name] + mmrChangeTeam1
                        : mmrChangeTeam1,
                };
            }
        }
        for (const player of team2) {
            if (player) {
                newState = {
                    ...newState,
                    [player.name]: acc[player.name]
                        ? acc[player.name] + mmrChangeTeam2
                        : mmrChangeTeam2,
                };
            }
        }

        return {
            ...acc,
            ...newState,
        };
    }, {});

    const topPlayers = [];
    for (const player in playerWithPoints) {
        topPlayers.push([player, playerWithPoints[player]]);
    }

    topPlayers.sort(function (a, b) {
        return b[1] - a[1];
    });

    const bestPlayer = topPlayers.length > 1 ? topPlayers[0] : "-";
    const worstPlayer = topPlayers.length > 1 ? topPlayers.at(-1) : "-";

    return (
        <>
            <Stat
                title="Today's matches"
                icon={<PiSoccerBallThin />}
                color="blue"
                value={todaysMatches}
            />
            <Stat
                title="Today's playtime"
                icon={<HiOutlineClock />}
                color="yellow"
                value={timeWasted}
            />
            <Stat
                title="Today's top"
                icon={<HiArrowUpRight />}
                color="green"
                value={
                    `${bestPlayer.at(0)}` +
                    (topPlayers.length > 1 ? ` (+${bestPlayer.at(1)})` : "")
                }
            />
            <Stat
                title="Today's flop"
                icon={<HiArrowDownRight />}
                color="red"
                value={
                    `${worstPlayer.at(0)}` +
                    (topPlayers.length > 1 ? ` (${worstPlayer.at(1)})` : "")
                }
            />
        </>
    );
}

export default TodayStats;
