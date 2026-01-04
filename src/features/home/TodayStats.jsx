import {
    HiArrowDownRight,
    HiArrowUpRight,
    HiOutlineClock,
} from "react-icons/hi2";
import { PiSoccerBallThin } from "react-icons/pi";
import Stat from "./Stat";
import { useTodayStats } from "./useTodayStats";
import { addMilliseconds } from "date-fns";
import SpinnerMini from "../../ui/SpinnerMini";
import { MATCH_ENDED } from "../../utils/constants";

function getTeams(match) {
    const {
        mmrChangeTeam1,
        mmrChangeTeam2,
        bounty_team1,
        bounty_team2,
        scoreTeam1,
        scoreTeam2,
        player1,
        player2,
        player3,
        player4,
    } = match;
    const team1 = [player1, player3];
    const team2 = [player2, player4];

    // Determine winner
    const team1Won = scoreTeam1 > scoreTeam2;

    // Calculate bounty per player (split in 2v2)
    const team1PlayerCount = team1.filter(Boolean).length;
    const team2PlayerCount = team2.filter(Boolean).length;

    // Bounty is only claimed by winners
    const bountyPerTeam1Player =
        team1Won && bounty_team1 > 0
            ? Math.floor(bounty_team1 / team1PlayerCount)
            : 0;
    const bountyPerTeam2Player =
        !team1Won && bounty_team2 > 0
            ? Math.floor(bounty_team2 / team2PlayerCount)
            : 0;

    return {
        team1,
        team2,
        mmrChangeTeam1,
        mmrChangeTeam2,
        bountyPerTeam1Player,
        bountyPerTeam2Player,
    };
}

function TodayStats() {
    const { matches, isLoading } = useTodayStats();

    // 1. Today's matches
    const todaysMatches = matches?.filter(
        (match) => match.status === MATCH_ENDED
    ).length;

    // 2. Time wasted
    const todaysTimePlayed = matches
        ?.filter((match) => match.status === MATCH_ENDED)
        .reduce(
            (acc, cur) =>
                acc + (new Date(cur.end_time) - new Date(cur.start_time)),
            0
        );

    const timePlayedDate = addMilliseconds(new Date(0), todaysTimePlayed);
    const pad = (num) => num.toString().padStart(2, "0");
    const hours =
        timePlayedDate.getUTCHours() > 0
            ? pad(timePlayedDate.getUTCHours())
            : "";
    const minutes = pad(timePlayedDate.getUTCMinutes());
    const seconds = pad(timePlayedDate.getUTCSeconds());
    const timeWasted = `${!hours ? "" : hours + ":"}${minutes}:${seconds}`;

    // 3. Today's top and flop
    const playerWithPoints = matches?.reduce((acc, cur) => {
        const {
            team1,
            team2,
            mmrChangeTeam1,
            mmrChangeTeam2,
            bountyPerTeam1Player,
            bountyPerTeam2Player,
        } = getTeams(cur);
        let newState = {};
        for (const player of team1) {
            if (player) {
                const totalChange =
                    (mmrChangeTeam1 || 0) + bountyPerTeam1Player;
                newState = {
                    ...newState,
                    [player.name]: acc[player.name]
                        ? acc[player.name] + totalChange
                        : totalChange,
                };
            }
        }
        for (const player of team2) {
            if (player) {
                const totalChange =
                    (mmrChangeTeam2 || 0) + bountyPerTeam2Player;
                newState = {
                    ...newState,
                    [player.name]: acc[player.name]
                        ? acc[player.name] + totalChange
                        : totalChange,
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
        if (player && playerWithPoints[player]) {
            topPlayers.push([player, playerWithPoints[player]]);
        }
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
                value={isLoading ? <SpinnerMini /> : todaysMatches}
            />
            <Stat
                title="Today's playtime"
                icon={<HiOutlineClock />}
                color="yellow"
                value={isLoading ? <SpinnerMini /> : timeWasted}
            />
            <Stat
                title="Today's top"
                icon={<HiArrowUpRight />}
                color="green"
                value={
                    isLoading ? (
                        <SpinnerMini />
                    ) : (
                        `${bestPlayer.at(0)}` +
                        (topPlayers.length > 1 ? ` (+${bestPlayer.at(1)})` : "")
                    )
                }
            />
            <Stat
                title="Today's flop"
                icon={<HiArrowDownRight />}
                color="red"
                value={
                    isLoading ? (
                        <SpinnerMini />
                    ) : (
                        `${worstPlayer.at(0)}` +
                        (topPlayers.length > 1 ? ` (${worstPlayer.at(1)})` : "")
                    )
                }
            />
        </>
    );
}

export default TodayStats;
