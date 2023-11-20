import { useParams } from "react-router-dom";
import styled from "styled-components";
import { DEFAULT_AVATAR } from "../../utils/constants";
import StatsTable from "./StatsTable";
import StatsFilterRow from "./StatsFilterRow";
import Avatar from "../../ui/Avatar";
import { usePlayerName } from "./usePlayerName";
import Error from "../../ui/Error";
import SpinnerMini from "../../ui/SpinnerMini";

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

function Profile() {
    const { userId } = useParams();
    const { player, isLoading, error } = usePlayerName(userId);

    if (error) {
        return <Error message={error.message} />;
    }

    return (
        <StyledProfile>
            {isLoading ? (
                <SpinnerMini />
            ) : (
                <Avatar $size="huge" src={player.avatar || DEFAULT_AVATAR} />
            )}
            <div>
                <StatsFilterRow />
                <StatsTable userId={userId} />
            </div>
        </StyledProfile>
    );
}

export default Profile;
