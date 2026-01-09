import { useParams } from "react-router-dom";
import styled from "styled-components";
import { DEFAULT_AVATAR, media } from "../../utils/constants";
import StatsTable from "./StatsTable";
import ClickableAvatar from "../../ui/ClickableAvatar";
import Avatar from "../../ui/Avatar";
import { usePlayerName } from "./usePlayerName";
import Error from "../../ui/Error";
import SpinnerMini from "../../ui/SpinnerMini";
import { usePlayerRank } from "../../hooks/usePlayerRank";
import {
    HiOutlineChartBar,
    HiOutlineTrophy,
    HiOutlineUser,
} from "react-icons/hi2";
import RecentPerformance from "./RecentPerformance";

const StyledProfile = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }

    ${media.mobile} {
        padding: 0;
        gap: 1.6rem;
    }
`;

const Card = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    ${media.tablet} {
        border-radius: var(--border-radius-sm);
    }

    ${media.mobile} {
        border-radius: 0;
        border-left: none;
        border-right: none;
    }
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 2rem 2.4rem;
    background-color: var(--color-grey-50);
    border-bottom: 1px solid var(--secondary-border-color);

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background-color: var(--primary-button-color);
    color: var(--primary-button-color-text);

    svg {
        width: 2rem;
        height: 2rem;
    }

    ${media.mobile} {
        width: 3.2rem;
        height: 3.2rem;

        svg {
            width: 1.6rem;
            height: 1.6rem;
        }
    }
`;

const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const CardTitle = styled.span`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--color-grey-800);

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const CardDescription = styled.span`
    font-size: 1.4rem;
    color: var(--color-grey-500);

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const CardBody = styled.div`
    padding: 2.4rem;

    ${media.mobile} {
        padding: 1.2rem;
    }
`;

const ProfileCard = styled(Card)`
    display: flex;
    flex-direction: column;

    ${media.desktop} {
        flex-direction: row;
        align-items: center;
    }
`;

const ProfileContent = styled.div`
    display: flex;
    gap: 4rem;
    padding: 2.4rem;
    flex: 1;

    ${media.desktop} {
        padding: 1.6rem 2.4rem;
        gap: 3rem;
        align-items: center;
    }

    ${media.tablet} {
        flex-direction: column;
        align-items: center;
        gap: 2.4rem;
    }

    ${media.mobile} {
        padding: 1.2rem;
        gap: 1.6rem;
    }
`;

const AvatarSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6rem;

    ${media.desktop} {
        flex-direction: row;
        gap: 1.6rem;
    }
`;

const StyledAvatar = styled(ClickableAvatar)`
    width: 16rem;
    height: 16rem;

    ${media.desktop} {
        width: 8rem;
        height: 8rem;
    }

    ${media.tablet} {
        width: 14rem;
        height: 14rem;
    }

    ${media.mobile} {
        width: 12rem;
        height: 12rem;
    }
`;

const PlayerName = styled.h2`
    font-size: 2.4rem;
    font-weight: 600;
    color: var(--color-grey-800);
    text-align: center;

    ${media.desktop} {
        font-size: 2rem;
        text-align: left;
    }

    ${media.mobile} {
        font-size: 2rem;
    }
`;

const InfoSection = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    min-width: 0;

    ${media.tablet} {
        width: 100%;
    }
`;

const RankGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.6rem;

    ${media.desktop} {
        display: flex;
        gap: 2rem;
    }

    ${media.mobile} {
        grid-template-columns: 1fr;
    }
`;

const RankCard = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.6rem;
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--secondary-border-color);

    ${media.desktop} {
        padding: 1rem 1.4rem;
        gap: 1rem;
    }

    ${media.mobile} {
        padding: 1.2rem;
        gap: 1rem;
    }
`;

const RankIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.8rem;
    height: 4.8rem;
    border-radius: 50%;
    background: ${(props) =>
        props.$variant === "gold"
            ? "linear-gradient(135deg, #FFD700 0%, #FFC107 100%)"
            : props.$variant === "silver"
            ? "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)"
            : props.$variant === "bronze"
            ? "linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)"
            : "var(--color-grey-100)"};

    ${media.desktop} {
        width: 3.6rem;
        height: 3.6rem;
    }

    ${media.mobile} {
        width: 4rem;
        height: 4rem;
    }

    svg {
        width: 2.4rem;
        height: 2.4rem;
        color: ${(props) =>
            props.$variant === "gold"
                ? "#7a5c00"
                : props.$variant === "silver"
                ? "#616161"
                : props.$variant === "bronze"
                ? "#5D4037"
                : "var(--color-grey-600)"};

        ${media.desktop} {
            width: 1.8rem;
            height: 1.8rem;
        }

        ${media.mobile} {
            width: 2rem;
            height: 2rem;
        }
    }
`;

const RankInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const RankLabel = styled.span`
    font-size: 1.3rem;
    color: var(--color-grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const RankValue = styled.span`
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--color-grey-800);

    ${media.desktop} {
        font-size: 1.8rem;
    }

    ${media.mobile} {
        font-size: 2rem;
    }
`;

const ProfileCardHeader = styled(CardHeader)`
    ${media.desktop} {
        display: none;
    }
`;

const StatsCard = styled(Card)`
    overflow: visible;
`;

function Profile() {
    const { userId } = useParams();
    const { player, isLoading, error } = usePlayerName(userId);
    const {
        rank1on1,
        rank2on2,
        isLoading: isLoadingRank,
    } = usePlayerRank(userId);

    let trophyVariant1on1;
    switch (rank1on1) {
        case 1:
            trophyVariant1on1 = "gold";
            break;
        case 2:
            trophyVariant1on1 = "silver";
            break;
        case 3:
            trophyVariant1on1 = "bronze";
            break;
        default:
            trophyVariant1on1 = "none";
    }

    let trophyVariant2on2;
    switch (rank2on2) {
        case 1:
            trophyVariant2on2 = "gold";
            break;
        case 2:
            trophyVariant2on2 = "silver";
            break;
        case 3:
            trophyVariant2on2 = "bronze";
            break;
        default:
            trophyVariant2on2 = "none";
    }

    if (error) {
        return <Error message={error.message} />;
    }

    return (
        <StyledProfile>
            <ProfileCard>
                <ProfileCardHeader>
                    <IconWrapper>
                        <HiOutlineUser />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Player Profile</CardTitle>
                        <CardDescription>
                            View player information and rankings
                        </CardDescription>
                    </HeaderContent>
                </ProfileCardHeader>
                <ProfileContent>
                    <AvatarSection>
                        {isLoading ? (
                            <SpinnerMini />
                        ) : (
                            <>
                                <StyledAvatar
                                    src={player?.avatar || DEFAULT_AVATAR}
                                    alt={`${player?.name}'s avatar`}
                                />
                                <PlayerName>{player?.name}</PlayerName>
                            </>
                        )}
                    </AvatarSection>
                    <InfoSection>
                        <RankGrid>
                            <RankCard>
                                {rank1on1 && rank1on1 <= 3 ? (
                                    <RankIcon $variant={trophyVariant1on1}>
                                        <HiOutlineTrophy />
                                    </RankIcon>
                                ) : (
                                    <></>
                                )}
                                <RankInfo>
                                    <RankLabel>1on1 Rank</RankLabel>
                                    <RankValue>
                                        {isLoadingRank ? (
                                            <SpinnerMini />
                                        ) : (
                                            `#${rank1on1 || "-"}`
                                        )}
                                    </RankValue>
                                </RankInfo>
                            </RankCard>
                            <RankCard>
                                {rank2on2 && rank2on2 <= 3 ? (
                                    <RankIcon $variant={trophyVariant2on2}>
                                        <HiOutlineTrophy />
                                    </RankIcon>
                                ) : (
                                    <></>
                                )}
                                <RankInfo>
                                    <RankLabel>2on2 Rank</RankLabel>
                                    <RankValue>
                                        {isLoadingRank ? (
                                            <SpinnerMini />
                                        ) : (
                                            `#${rank2on2 || "-"}`
                                        )}
                                    </RankValue>
                                </RankInfo>
                            </RankCard>
                        </RankGrid>
                    </InfoSection>
                </ProfileContent>
            </ProfileCard>

            <StatsCard>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlineChartBar />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Statistics</CardTitle>
                        <CardDescription>
                            Detailed performance metrics and playtime
                        </CardDescription>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
                    <StatsTable userId={userId} />
                </CardBody>
            </StatsCard>

            <RecentPerformance playerName={userId} playerId={player?.id} />
        </StyledProfile>
    );
}

export default Profile;
