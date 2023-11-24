import { useParams } from "react-router-dom";
import styled from "styled-components";
import { DEFAULT_AVATAR } from "../../utils/constants";
import StatsTable from "./StatsTable";
import StatsFilterRow from "./StatsFilterRow";
import Avatar from "../../ui/Avatar";
import { usePlayerName } from "./usePlayerName";
import Error from "../../ui/Error";
import SpinnerMini from "../../ui/SpinnerMini";
import { usePlayerRank } from "../../hooks/usePlayerRank";

const StyledProfile = styled.div`
    display: flex;
    flex-direction: column;
    align-items: start;
    margin-top: 2rem;
    gap: 2.4rem;
`;

const PlayerInfo = styled.div`
    display: flex;

    gap: 2.4rem;
    padding: 0 2.4rem;
    width: 100%;
`;

const PlayerInfoRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const PlayerTextContainer = styled.div`
    flex-direction: column;
    width: 100%;
`;

function ProfileMobile() {
    const { userId } = useParams();
    const { player, isLoading, error } = usePlayerName(userId);
    const {
        rank1on1,
        rank2on2,
        isLoading: isLoadingRank,
    } = usePlayerRank(userId);

    if (error) {
        return <Error message={error.message} />;
    }

    return (
        <StyledProfile>
            {isLoading ? (
                <SpinnerMini />
            ) : (
                <PlayerInfo>
                    <Avatar
                        $size="large"
                        src={player.avatar || DEFAULT_AVATAR}
                    />
                    <PlayerTextContainer>
                        <PlayerInfoRow>
                            <span>Name:</span> <span>{player.name}</span>
                        </PlayerInfoRow>
                        <PlayerInfoRow>
                            <span>Rank (1on1):</span>{" "}
                            <span>
                                {isLoadingRank ? <SpinnerMini /> : rank1on1}
                            </span>
                        </PlayerInfoRow>
                        <PlayerInfoRow>
                            <span>Rank (2on2):</span>{" "}
                            <span>
                                {isLoadingRank ? <SpinnerMini /> : rank2on2}
                            </span>
                        </PlayerInfoRow>
                        {/* <PlayerInfoRow>
                            <span>About me:</span> <span>{player.name}</span>
                        </PlayerInfoRow> */}
                    </PlayerTextContainer>
                </PlayerInfo>
            )}
            <div>
                <StatsFilterRow />
                <StatsTable userId={userId} />
            </div>
        </StyledProfile>
    );
}

export default ProfileMobile;
