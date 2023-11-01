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

function calcPerformance(match) {
    const { scoreTeam1, scoreTeam2, player1, player2 } = match;

    const winner = scoreTeam1 > scoreTeam2 ? player1 : player2;
    const loser = scoreTeam1 > scoreTeam2 ? player2 : player1;
    if (scoreTeam1 === 0 || scoreTeam2 === 0) {
        return { winner, points: 3, loser };
    }

    return { winner, points: 1, loser };
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
        const { winner, points, loser } = calcPerformance(cur);
        return {
            ...acc,
            [winner.name]: acc[winner.name]
                ? acc[winner.name] + points
                : points,
            ...acc,
            [loser.name]: acc[loser.name] ? acc[loser.name] - points : -points,
        };
    }, {});

    const topPlayers = [];
    for (const player in playerWithPoints) {
        topPlayers.push([player, playerWithPoints[player]]);
    }

    topPlayers.sort(function (a, b) {
        return b[1] - a[1];
    });

    const bestPlayer = topPlayers.length > 1 ? topPlayers[0][0] : "-";
    const worstPlayer = topPlayers.length > 1 ? topPlayers.at(-1)[0] : " - ";

    return (
        <>
            <Stat
                title="Today's matches"
                icon={<PiSoccerBallThin />}
                color="blue"
                value={todaysMatches}
            />
            <Stat
                title="Time wasted"
                icon={<HiOutlineClock />}
                color="yellow"
                value={timeWasted}
            />
            <Stat
                title="Today's top"
                icon={<HiArrowUpRight />}
                color="green"
                value={bestPlayer}
            />
            <Stat
                title="Today's flop"
                icon={<HiArrowDownRight />}
                color="red"
                value={worstPlayer}
            />
        </>
    );
}

export default TodayStats;
