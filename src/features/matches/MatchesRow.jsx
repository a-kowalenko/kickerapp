import styled from "styled-components";
import Table from "../../ui/Table";
import { format } from "date-fns";
import Avatar from "../../ui/Avatar";
import { Link } from "react-router-dom";
import { DEFAULT_AVATAR } from "../../utils/constants";

const Rank = styled.div`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--color-grey-600);
`;

const Name = styled(Link)`
    display: flex;
    gap: 0.8rem;
    font-size: 1.6rem;
    font-weight: 400;
    width: fit-content;
`;

const Stat = styled.div`
    font-family: "Sono";
    font-size: 1.6rem;
    font-weight: 500;
    text-align: center;
`;

const ScoreContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.2rem;
`;

const Score = styled.div`
    display: flex;
    font-weight: 600;
    min-width: 2rem;
    align-items: center;
    justify-content: ${(props) =>
        props.$team === "1" ? "flex-end" : "flex-start"};
`;

const TeamContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: ${(props) =>
        props.$team === "1" ? "flex-end" : "flex-start"};

    & a {
        color: ${(props) => (props.$won ? "green" : "red")};
    }
`;

const GameModeCeontainer = styled.div`
    display: flex;
    justify-content: center;
`;

const StartTimeContainer = styled.div`
    display: flex;
    justify-content: center;
`;

const DurationContainer = styled.div`
    display: flex;
`;

function MatchesRow({ match }) {
    const { player1, player2, player3, player4 } = match;

    const gameMode =
        !player3 && !player4
            ? "1 on 1"
            : !player3
            ? "1 on 2"
            : !player4
            ? "2 on 1"
            : "2 on 2";

    const team1Won = match.scoreTeam1 > match.scoreTeam2;

    return (
        <Table.Row>
            <Rank>{match.id}</Rank>

            <TeamContainer $won={team1Won} $team="1">
                <Name to={`/user/${player1.name}/profile`}>
                    <span>{player1.name}</span>
                    {match.mmrChangeTeam1 && match.mmrPlayer1 && (
                        <span>
                            ({match.mmrPlayer1}){team1Won ? "+" : ""}
                            {match.mmrChangeTeam1}
                        </span>
                    )}
                    <Avatar $size="xs" src={player1.avatar || DEFAULT_AVATAR} />
                </Name>
                {player3 && (
                    <Name to={`/user/${player3.name}/profile`}>
                        <span>{player3?.name}</span>
                        {match.mmrChangeTeam1 && match.mmrPlayer3 && (
                            <span>
                                ({match.mmrPlayer3}){team1Won ? "+" : ""}
                                {match.mmrChangeTeam1}
                            </span>
                        )}
                        <Avatar
                            $size="xs"
                            src={player3.avatar || DEFAULT_AVATAR}
                        />
                    </Name>
                )}
            </TeamContainer>

            <ScoreContainer>
                <Score $team="1">{match.scoreTeam1}</Score>
                &mdash;
                <Score $team="2">{match.scoreTeam2}</Score>
            </ScoreContainer>

            <TeamContainer $won={!team1Won} $team="2">
                <Name to={`/user/${player2.name}/profile`}>
                    <Avatar $size="xs" src={player2.avatar || DEFAULT_AVATAR} />
                    <span>{player2.name}</span>
                    {match.mmrChangeTeam2 && match.mmrPlayer2 && (
                        <span>
                            ({match.mmrPlayer2}){team1Won ? "" : "+"}
                            {match.mmrChangeTeam2}
                        </span>
                    )}
                </Name>
                {player4 && (
                    <Name to={`/user/${player4.name}/profile`}>
                        <Avatar
                            $size="xs"
                            src={player4?.avatar || DEFAULT_AVATAR}
                        />
                        <span>{player4.name}</span>
                        {match.mmrChangeTeam2 && match.mmrPlayer4 && (
                            <span>
                                ({match.mmrPlayer4}){team1Won ? "" : "+"}
                                {match.mmrChangeTeam2}
                            </span>
                        )}
                    </Name>
                )}
            </TeamContainer>

            <GameModeCeontainer>
                <span>{gameMode}</span>
            </GameModeCeontainer>

            <StartTimeContainer>
                <span>
                    {format(
                        new Date(match.start_time),
                        "dd.MM.yyyy - HH:mm:ss"
                    )}
                </span>
            </StartTimeContainer>

            <DurationContainer>
                {match.end_time && (
                    <span>
                        {format(
                            new Date(match.end_time) -
                                new Date(match.start_time),
                            "mm:ss"
                        )}
                    </span>
                )}
                {match.status === "active" && <span>Is active</span>}
            </DurationContainer>
        </Table.Row>
    );
}

export default MatchesRow;
