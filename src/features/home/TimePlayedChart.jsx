import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { enUS } from "date-fns/locale";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { format } from "date-fns";
import { usePlayers } from "../../hooks/usePlayers";
import { daysInMonth, hasPlayerWonMatch } from "../../utils/helpers";
import ContentBox from "../../ui/ContentBox";
import styled from "styled-components";
import {
    GAMEMODE_1ON1,
    GAMEMODE_2ON1,
    GAMEMODE_2ON2,
    MATCH_ACTIVE,
    colorsLight,
    media,
} from "../../utils/constants";
import { useState } from "react";
import Dropdown from "../../ui/Dropdown";
import Row from "../../ui/Row";
import Heading from "../../ui/Heading";
import useWindowWidth from "../../hooks/useWindowWidth";
import { usePlayerHistory } from "./usePlayerHistory";
import SpinnerMini from "../../ui/SpinnerMini";
import { useTodayStats } from "./useTodayStats";
import SwitchButton from "../../ui/SwitchButton";
import Divider from "../../ui/Divider";
import { useKickerInfo } from "../../hooks/useKickerInfo";

const StyledTimePlayedChart = styled(ContentBox)`
    grid-area: 4 / 1 / 7 / 5;

    @media (max-width: 1350px) {
        grid-area: 6 / 1 / 7 / 3;
    }
`;

const TooltipEntry = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.2rem;
    color: ${(props) => props.$color};
`;

const TooltipText = styled.div``;

const TooltipValue = styled.div`
    text-align: right;
    white-space: pre-wrap;
`;
const TooltipDurationValue = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
`;

const FilterRow = styled.div`
    display: flex;
    align-items: center;
    gap: 2.4rem;

    flex-wrap: wrap;

    ${media.mobile} {
        padding: 0 1rem;
        gap: 1rem;
        justify-content: space-between;

        & div div {
            padding: 1rem;
        }

        & ul div {
            padding: 0.6rem;
        }
    }
`;

function TimePlayedChart() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentMonthText = format(today, "LLLL", { locale: enUS });

    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [type, setType] = useState("duration");
    const [isCumulated, setIsCumulated] = useState(true);
    const [gamemode, setGamemode] = useState("all");

    const { isMobile } = useWindowWidth();
    const { data: kickerInfo, isLoading: isLoadingKickerInfo } =
        useKickerInfo();
    const { players, isLoading: isLoadingPlayers } = usePlayers();
    const { matches, isLoading: isLoadingMatches } = useTodayStats();
    const { history, isLoadingHistory } = usePlayerHistory({
        month,
        year,
    });

    const isLoadingSomething =
        isLoadingKickerInfo ||
        isLoadingPlayers ||
        isLoadingMatches ||
        isLoadingHistory;
    const finalType = gamemode === GAMEMODE_1ON1 ? type : type + gamemode;

    let data = [];

    if (!isLoadingMatches && !isLoadingHistory && !isLoadingPlayers) {
        data = calculateHistoryData(
            players,
            today,
            matches,
            data,
            history,
            isCumulated
        );
    }
    const finalData = transformToMonthlyData(month, year, data);
    const playersObject = createPlayersObject(isLoadingPlayers, players);
    const { options, gamemodeOptions, monthOptions, yearOptions } =
        createDropdownOptionLists(
            type,
            isLoadingKickerInfo,
            kickerInfo,
            year,
            currentMonth,
            currentYear
        );

    function handleTypeFilter(option) {
        setType(option);
        if (
            option === "mmr" &&
            ![GAMEMODE_1ON1, GAMEMODE_2ON2].includes(gamemode)
        ) {
            setGamemode(GAMEMODE_1ON1);
        }
    }

    function handleGamemodeFilter(option) {
        setGamemode(option);
    }

    return (
        <StyledTimePlayedChart>
            <Row type="horizontal">
                <Heading as="h2">
                    Kicker Statistics - {currentMonthText}
                </Heading>
            </Row>
            <FilterRow>
                <Dropdown
                    minWidth={isMobile ? "20rem" : "25rem"}
                    options={options}
                    onSelect={(option) => handleTypeFilter(option)}
                    initSelected={options.find(
                        (option) => option.value === type
                    )}
                />
                <Dropdown
                    minWidth={isMobile ? "12rem" : "14rem"}
                    options={gamemodeOptions}
                    onSelect={(option) => handleGamemodeFilter(option)}
                    initSelected={{
                        text: gamemode,
                        value: gamemode,
                    }}
                />
                <Dropdown
                    minWidth={isMobile ? "20rem" : "25rem"}
                    options={monthOptions}
                    onSelect={(option) => setMonth(option)}
                    initSelected={{
                        text: format(new Date().setMonth(month), "LLLL", {
                            locale: enUS,
                        }),
                        value: month,
                    }}
                />
                <Dropdown
                    minWidth={isMobile ? "12rem" : "14rem"}
                    options={yearOptions}
                    onSelect={(option) => {
                        setYear(option);
                        const newYear = option;
                        const newMonth =
                            newYear === currentYear ? currentMonth : 11;
                        setMonth(newMonth);
                    }}
                    initSelected={{
                        text: format(new Date().setFullYear(year), "yyyy", {
                            locale: enUS,
                        }),
                        value: year,
                    }}
                />
                <SwitchButton
                    label="Cumulated"
                    value={isCumulated}
                    onChange={() => setIsCumulated((c) => !c)}
                />
                {isLoadingSomething ? <SpinnerMini /> : null}
            </FilterRow>

            <ResponsiveContainer width="100%" height={isMobile ? 400 : 500}>
                <LineChart
                    width={600}
                    height={300}
                    data={isLoadingHistory ? null : finalData}
                    margin={{ top: 5, right: 5, bottom: 0, left: 10 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-grey-300)"
                    />
                    <XAxis
                        dataKey="date"
                        dy={5}
                        interval={"preserveStartEnd"}
                    />
                    <YAxis
                        domain={["auto", "auto"]}
                        tick={<CustomizedAxisTick type={finalType} />}
                    />
                    {month === currentMonth && year === currentYear && (
                        <ReferenceLine
                            x={today.getDate()}
                            stroke={`var(--primary-button-color)`}
                            strokeWidth={3}
                            label="Today"
                            strokeDasharray="3 3"
                        />
                    )}
                    <Tooltip
                        content={
                            <CustomTooltip
                                type={finalType}
                                playersObject={playersObject}
                            />
                        }
                    />

                    <Legend formatter={renderLegendText} />
                    {isLoadingPlayers ? (
                        <LoadingSpinner />
                    ) : (
                        players.map((player) => (
                            <Line
                                type="monotone"
                                name={player.name}
                                dataKey={`${player.id}.${finalType}`}
                                key={player.name}
                                stroke={playersObject[player.id].color}
                                playerId={player.id}
                                activeDot={{ r: 4 }}
                                strokeWidth={2}
                            />
                        ))
                    )}
                </LineChart>
            </ResponsiveContainer>
        </StyledTimePlayedChart>
    );
}

function createPlayersObject(isLoadingPlayers, players) {
    const playersObject = {};

    if (!isLoadingPlayers) {
        for (const [i, player] of players
            .sort((a, b) => a.id - b.id)
            .entries()) {
            playersObject[player.id] = {
                player_id: player.id,
                color: colorsLight[i % players.length],
            };
        }
    }
    return playersObject;
}

function createDropdownOptionLists(
    type,
    isLoadingKickerInfo,
    kickerInfo,
    year,
    currentMonth,
    currentYear
) {
    const options = [
        { text: "Duration", value: "duration" },
        { text: "MMR", value: "mmr" },
        { text: "Matches played", value: "matchesPlayed" },
        { text: "Wins", value: "wins" },
        { text: "Losses", value: "losses" },
    ];

    const gamemodeOptions =
        type === "mmr"
            ? [
                  { text: GAMEMODE_1ON1, value: GAMEMODE_1ON1 },
                  { text: GAMEMODE_2ON2, value: GAMEMODE_2ON2 },
              ]
            : [
                  { text: "all", value: "all" },
                  { text: GAMEMODE_1ON1, value: GAMEMODE_1ON1 },
                  { text: GAMEMODE_2ON2, value: GAMEMODE_2ON2 },
                  { text: GAMEMODE_2ON1, value: GAMEMODE_2ON1 },
              ];

    const monthOptions = [];
    const yearOptions = [];

    if (!isLoadingKickerInfo) {
        const kickerCreationDate = new Date(kickerInfo.created_at);
        const kickerCreationMonth = kickerCreationDate.getMonth();
        const kickerCreationYear = kickerCreationDate.getFullYear();
        const minMonth = kickerCreationYear === year ? kickerCreationMonth : 0;

        // Fix: For past years, show all months (0-11), for current year show up to current month
        const maxMonth = year < currentYear ? 11 : currentMonth;

        for (let i = maxMonth; i >= minMonth; i--) {
            monthOptions.push({
                text: format(new Date().setMonth(i), "LLLL", { locale: enUS }),
                value: i,
            });
        }

        for (let i = currentYear; i >= kickerCreationYear; i--) {
            yearOptions.push({
                text: format(new Date().setFullYear(i), "yyyy", {
                    locale: enUS,
                }),
                value: i,
            });
        }
    }
    return { options, gamemodeOptions, monthOptions, yearOptions };
}

function transformToMonthlyData(month, year, data) {
    const finalData = [];
    const maxDays = daysInMonth(month + 1, year);
    for (let i = 1; i <= maxDays; i++) {
        const dataset = data?.find(
            (item) =>
                item.date === format(new Date(year, month, i), "dd.MM.yyyy")
        );
        if (dataset) {
            finalData.push(dataset);
        } else {
            finalData.push({});
        }
    }
    return finalData;
}

function calculateHistoryData(
    players,
    today,
    matches,
    data,
    history,
    isCumulated
) {
    let todaysDataObject = {};
    for (const player of players) {
        todaysDataObject[player.id] = {
            player_name: player.name,
            player_id: player.id,
            user_id: player.user_id,
            kicker_id: player.kicker_id,
            mmr: player.mmr,
            mmr2on2: player.mmr2on2,
            wins: 0,
            wins2on2: 0,
            wins2on1: 0,
            losses: 0,
            losses2on2: 0,
            losses2on1: 0,
            duration: 0,
            duration2on2: 0,
            duration2on1: 0,
            created_at: today.toISOString(),
        };
    }

    todaysDataObject = matches
        ?.filter((m) => m.status !== MATCH_ACTIVE)
        .reduce((acc, cur) => {
            const mode = cur.gamemode;
            const { player1, player2, player3, player4 } = cur;
            const playersList = [player1, player2, player3, player4].filter(
                (p) => p !== null
            );
            const duration =
                (new Date(cur.end_time) - new Date(cur.start_time)) / 1000;

            for (const player of playersList) {
                if (mode === GAMEMODE_1ON1) {
                    if (hasPlayerWonMatch(player.id, cur)) {
                        acc[player.id].wins += 1;
                    } else {
                        acc[player.id].losses += 1;
                    }
                    acc[player.id].duration += duration;
                }
                if (mode === GAMEMODE_2ON2) {
                    if (hasPlayerWonMatch(player.id, cur)) {
                        acc[player.id].wins2on2 += 1;
                    } else {
                        acc[player.id].losses2on2 += 1;
                    }
                    acc[player.id].duration2on2 += duration;
                }
                if (mode === GAMEMODE_2ON1) {
                    if (hasPlayerWonMatch(player.id, cur)) {
                        acc[player.id].wins2on1 += 1;
                    } else {
                        acc[player.id].losses2on1 += 1;
                    }
                    acc[player.id].duration2on1 += duration;
                }
            }

            return acc;
        }, todaysDataObject);

    const todaysDataArray = Object.values(todaysDataObject);

    data = [...history, ...todaysDataArray]?.reduce((acc, cur) => {
        const currentIndex = acc.length - 1;
        const date = format(new Date(cur.created_at), "dd.MM.yyyy");

        const newCur = {
            ...cur,
            matchesPlayedall:
                cur.wins +
                cur.losses +
                cur.wins2on2 +
                cur.losses2on2 +
                cur.wins2on1 +
                cur.losses2on1,
            matchesPlayed: cur.wins + cur.losses,
            matchesPlayed2on2: cur.wins2on2 + cur.losses2on2,
            matchesPlayed2on1: cur.wins2on1 + cur.losses2on1,
            winsall: cur.wins + cur.wins2on2 + cur.wins2on1,
            lossesall: cur.losses + cur.losses2on2 + cur.losses2on1,
            durationall: cur.duration + cur.duration2on2 + cur.duration2on1,
        };

        if (acc.length === 0) {
            return [
                {
                    date,
                    [cur.player_id]: newCur,
                },
            ];
        }

        if (date === acc[currentIndex].date) {
            acc[currentIndex][cur.player_id] = newCur;
        } else {
            acc = [
                ...acc,
                {
                    date,
                    [cur.player_id]: newCur,
                },
            ];
        }

        if (isCumulated && acc.length > 1) {
            if (acc[acc.length - 2][newCur.player_id] === undefined) {
                // TODO: ignore for now (quick fix?)
            } else {
                newCur.matchesPlayedall +=
                    acc[acc.length - 2][newCur.player_id].matchesPlayedall;
                newCur.matchesPlayed +=
                    acc[acc.length - 2][newCur.player_id].matchesPlayed;
                newCur.matchesPlayed2on2 +=
                    acc[acc.length - 2][newCur.player_id].matchesPlayed2on2;
                newCur.matchesPlayed2on1 +=
                    acc[acc.length - 2][newCur.player_id].matchesPlayed2on1;
                newCur.winsall += acc[acc.length - 2][newCur.player_id].winsall;
                newCur.lossesall +=
                    acc[acc.length - 2][newCur.player_id].lossesall;
                newCur.durationall +=
                    acc[acc.length - 2][newCur.player_id].durationall;
                newCur.duration +=
                    acc[acc.length - 2][newCur.player_id].duration;
                newCur.duration2on2 +=
                    acc[acc.length - 2][newCur.player_id].duration2on2;
                newCur.duration2on1 +=
                    acc[acc.length - 2][newCur.player_id].duration2on1;
                newCur.wins += acc[acc.length - 2][newCur.player_id].wins;
                newCur.wins2on2 +=
                    acc[acc.length - 2][newCur.player_id].wins2on2;
                newCur.wins2on1 +=
                    acc[acc.length - 2][newCur.player_id].wins2on1;
                newCur.losses += acc[acc.length - 2][newCur.player_id].losses;
                newCur.losses2on2 +=
                    acc[acc.length - 2][newCur.player_id].losses2on2;
                newCur.losses2on1 +=
                    acc[acc.length - 2][newCur.player_id].losses2on1;
            }
        }

        return acc;
    }, []);
    return data;
}

function formatDuration(seconds) {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return (
        <TooltipDurationValue>
            <span>{hours}h</span>
            <span>{minutes}m</span>
        </TooltipDurationValue>
    );
}

function formatDurationToText(seconds) {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}

function CustomizedAxisTick({ x, y, payload, type }) {
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={0}
                textAnchor="end"
                fill="var(--primary-text-color)"
            >
                {type.includes("duration")
                    ? formatDurationToText(payload.value)
                    : payload.value}
            </text>
        </g>
    );
}

function CustomTooltip({ active, payload, label, type }) {
    if (active && payload && payload.length) {
        const finalPayload = [];
        for (const player of Object.values(payload)) {
            const player_id = player.dataKey.split(".")[0];
            const actualPayload = player.payload[player_id];
            if (player.name) {
                finalPayload.push({
                    name: player.name,
                    value: actualPayload[type],
                    color: player.color,
                });
            }
        }

        return (
            <div
                className="custom-tooltip"
                style={{
                    backgroundColor: "var(--tertiary-background-color)",
                    padding: "10px",
                    border: "1px solid var(--primary-text-color)",
                }}
            >
                <TooltipEntry>
                    <TooltipText>Date:</TooltipText>
                    <TooltipValue>{label}</TooltipValue>
                </TooltipEntry>
                <Divider />
                {finalPayload
                    .sort((a, b) => b.value - a.value)
                    .map((entry, index) => (
                        <TooltipEntry
                            key={index}
                            $color={entry.color}
                            $index={index}
                            $length={finalPayload.length}
                        >
                            <TooltipText>{entry.name}:</TooltipText>
                            <TooltipValue>
                                {type.includes("duration")
                                    ? formatDuration(entry.value)
                                    : entry.value}
                            </TooltipValue>
                        </TooltipEntry>
                    ))}
            </div>
        );
    }

    return null;
}

function renderLegendText(value) {
    return <span>{value.split(".")[0]}</span>;
}

export default TimePlayedChart;
