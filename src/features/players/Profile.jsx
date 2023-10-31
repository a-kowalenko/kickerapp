import styled from "styled-components";
import Avatar from "../../ui/Avatar";
import { DEFAULT_AVATAR } from "../../utils/constants";

const StyledProfile = styled.div`
    display: flex;
    align-items: start;
    margin-top: 2rem;
    gap: 2.4rem;
`;

const StatsContainer = styled.div`
    display: flex;
    flex-direction: column;
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

function Profile({ player }) {
    const { avatar, wins, losses, mmr } = player;
    return (
        <StyledProfile>
            <Avatar $size="huge" src={avatar || DEFAULT_AVATAR} />
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
        </StyledProfile>
    );
}

export default Profile;
