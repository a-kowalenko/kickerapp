import styled from "styled-components";
import Avatar from "../../ui/Avatar";
import { usePlayerName } from "./usePlayerName";
import Spinner from "../../ui/Spinner";

const StyledProfile = styled.div`
    display: flex;
    margin-top: 2rem;
`;

const StatsContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: first baseline;
`;

const Stat = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    gap: 2.4rem;
    font-size: large;
    font-weight: 500;
    padding: 0.3rem 2.4rem;
    border-bottom: 1px solid #6363633b;
`;

const LeftBox = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
`;

function Profile({ username }) {
    console.log("username", username);
    const { player, isLoading } = usePlayerName(username);

    if (isLoading) {
        return <Spinner />;
    }
    const { avatar, wins, losses, mmr } = player;

    console.log(player);
    return (
        <StyledProfile>
            <LeftBox>
                <Avatar $size="huge" src={avatar || "/default-user.jpg"} />
                <StatsContainer>
                    <Stat>
                        <div>Wins:</div>
                        <div>{wins}</div>
                    </Stat>
                    <Stat>
                        <div>Losses:</div>
                        <div>{losses}</div>
                    </Stat>
                    <Stat>
                        <div>MMR:</div>
                        <div>{mmr}</div>
                    </Stat>
                </StatsContainer>
            </LeftBox>
        </StyledProfile>
    );
}

export default Profile;
