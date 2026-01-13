import { useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import {
    HiOutlineCalendar,
    HiOutlineUser,
    HiOutlineUserGroup,
    HiOutlineShieldCheck,
} from "react-icons/hi2";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import { useSeasons } from "../seasons/useSeasons";
import { usePlayers } from "../../hooks/usePlayers";
import Avatar from "../../ui/Avatar";
import MediaViewer from "../../ui/MediaViewer";
import Spinner from "../../ui/Spinner";
import SectionTitle from "../../ui/SectionTitle";
import { DEFAULT_AVATAR, media } from "../../utils/constants";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const Card = styled.div`
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);
    padding: 2.4rem;

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

const KickerHeader = styled.div`
    display: flex;
    gap: 2.4rem;
    align-items: center;

    ${media.mobile} {
        flex-direction: column;
        text-align: center;
    }
`;

const KickerAvatar = styled.img`
    width: 10rem;
    height: 10rem;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--primary-button-color);
    cursor: ${(props) => (props.$isClickable ? "pointer" : "default")};
    transition: filter 0.2s ease;

    &:hover {
        filter: ${(props) =>
            props.$isClickable ? "brightness(0.85)" : "none"};
    }

    ${media.mobile} {
        width: 8rem;
        height: 8rem;
    }
`;

const KickerDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
`;

const KickerName = styled.h2`
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--primary-text-color);
    margin: 0;

    ${media.mobile} {
        font-size: 2rem;
    }
`;

const KickerMeta = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 1.2rem 2rem;
    font-size: 1.3rem;
    color: var(--secondary-text-color);

    ${media.mobile} {
        justify-content: center;
    }
`;

const MetaItem = styled.span`
    display: flex;
    align-items: center;
    gap: 0.4rem;

    & svg {
        font-size: 1.4rem;
    }
`;

const AdminCard = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.2rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
`;

const AdminInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const AdminLabel = styled.span`
    font-size: 1.1rem;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const AdminName = styled(Link)`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--primary-text-color);

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    text-decoration: none;
    transition: color 0.2s;

    &:hover {
        /* color: var(--color-brand-700); */
        text-decoration: underline;
    }
`;

const SeasonsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
`;

const SeasonItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.2rem;
    padding: 1.2rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    border-left: 3px solid
        ${(props) =>
            props.$isActive
                ? "var(--color-brand-500)"
                : "var(--primary-border-color)"};

    ${media.mobile} {
        flex-direction: column;
        align-items: flex-start;
    }
`;

const SeasonInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const SeasonName = styled.span`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--primary-text-color);
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const ActiveBadge = styled.span`
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-brand-700);
    background-color: var(--color-brand-100);
    padding: 0.2rem 0.6rem;
    border-radius: var(--border-radius-sm);
`;

const SeasonDates = styled.span`
    font-size: 1.2rem;
    color: var(--secondary-text-color);
`;

const PlayersList = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 0.8rem;
`;

const PlayerItem = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
`;

const PlayerInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
`;

const PlayerLink = styled(Link)`
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    text-decoration: none;
    transition: color 0.2s;

    &:hover {
        /* color: var(--color-brand-700); */
        text-decoration: underline;
    }
`;

const PlayerMeta = styled.span`
    font-size: 1.1rem;
    color: var(--secondary-text-color);
`;

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    padding: 4rem;
`;

const EmptyText = styled.p`
    font-size: 1.3rem;
    color: var(--secondary-text-color);
    text-align: center;
    padding: 1.6rem;
`;

function KickerInfo() {
    const [showAvatarViewer, setShowAvatarViewer] = useState(false);
    const { data: kickerData, isLoading: isLoadingKicker } = useKickerInfo();
    const { seasons, isLoading: isLoadingSeasons } = useSeasons();
    const { players, isLoading: isLoadingPlayers } = usePlayers();

    if (isLoadingKicker) {
        return (
            <LoadingContainer>
                <Spinner />
            </LoadingContainer>
        );
    }

    // Find admin player
    const adminPlayer = players?.find((p) => p.user_id === kickerData?.admin);

    // Sort seasons: newest first (by season_number descending)
    const sortedSeasons = seasons
        ? [...seasons].sort((a, b) => b.season_number - a.season_number)
        : [];

    // Sort players: oldest first (by created_at ascending)
    const sortedPlayers = players
        ? [...players].sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
          )
        : [];

    const formatDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const kickerAvatarSrc = kickerData?.avatar || DEFAULT_AVATAR;
    const isAvatarClickable =
        kickerAvatarSrc && kickerAvatarSrc !== DEFAULT_AVATAR;

    return (
        <Container>
            {/* Kicker Header Section */}
            <Section>
                <Card>
                    <KickerHeader>
                        <KickerAvatar
                            src={kickerAvatarSrc}
                            alt={kickerData?.name}
                            $isClickable={isAvatarClickable}
                            onClick={() =>
                                isAvatarClickable && setShowAvatarViewer(true)
                            }
                        />
                        <KickerDetails>
                            <KickerName>{kickerData?.name}</KickerName>
                            <KickerMeta>
                                <MetaItem>
                                    <HiOutlineCalendar />
                                    Created {formatDate(kickerData?.created_at)}
                                </MetaItem>
                                <MetaItem>
                                    <HiOutlineUserGroup />
                                    {players?.length || 0} Players
                                </MetaItem>
                                <MetaItem>
                                    <HiOutlineCalendar />
                                    {seasons?.length || 0} Seasons
                                </MetaItem>
                            </KickerMeta>
                        </KickerDetails>
                    </KickerHeader>
                </Card>
            </Section>

            {/* Admin Section */}
            <Section>
                <SectionTitle>
                    <HiOutlineShieldCheck />
                    Administrator
                </SectionTitle>
                <Card>
                    {adminPlayer ? (
                        <AdminCard>
                            <Avatar player={adminPlayer} $size="medium" />
                            <AdminInfo>
                                <AdminLabel>Kicker Admin</AdminLabel>
                                <AdminName
                                    to={`/user/${adminPlayer.name}/profile`}
                                >
                                    {adminPlayer.name}
                                </AdminName>
                            </AdminInfo>
                        </AdminCard>
                    ) : (
                        <EmptyText>No admin found</EmptyText>
                    )}
                </Card>
            </Section>

            {/* Season History Section */}
            <Section>
                <SectionTitle>
                    <HiOutlineCalendar />
                    Season History
                </SectionTitle>
                <Card>
                    {isLoadingSeasons ? (
                        <LoadingContainer>
                            <Spinner />
                        </LoadingContainer>
                    ) : sortedSeasons.length === 0 ? (
                        <EmptyText>No seasons yet</EmptyText>
                    ) : (
                        <SeasonsList>
                            {sortedSeasons.map((season) => (
                                <SeasonItem
                                    key={season.id}
                                    $isActive={season.is_active}
                                >
                                    <SeasonInfo>
                                        <SeasonName>
                                            {season.name ||
                                                `Season ${season.season_number}`}
                                            {season.is_active && (
                                                <ActiveBadge>
                                                    Active
                                                </ActiveBadge>
                                            )}
                                        </SeasonName>
                                        <SeasonDates>
                                            {formatDate(season.start_date)}
                                            {" — "}
                                            {season.end_date
                                                ? formatDate(season.end_date)
                                                : "Ongoing"}
                                        </SeasonDates>
                                    </SeasonInfo>
                                </SeasonItem>
                            ))}
                        </SeasonsList>
                    )}
                </Card>
            </Section>

            {/* Players Section */}
            <Section>
                <SectionTitle>
                    <HiOutlineUser />
                    Players ({players?.length || 0})
                </SectionTitle>
                <Card>
                    {isLoadingPlayers ? (
                        <LoadingContainer>
                            <Spinner />
                        </LoadingContainer>
                    ) : sortedPlayers.length === 0 ? (
                        <EmptyText>No players yet</EmptyText>
                    ) : (
                        <PlayersList>
                            {sortedPlayers.map((player) => (
                                <PlayerItem key={player.id}>
                                    <Avatar player={player} $size="small" />
                                    <PlayerInfo>
                                        <PlayerLink
                                            to={`/user/${player.name}/profile`}
                                        >
                                            {player.name}
                                        </PlayerLink>
                                        <PlayerMeta>
                                            Joined{" "}
                                            {formatDate(player.created_at)}
                                        </PlayerMeta>
                                    </PlayerInfo>
                                </PlayerItem>
                            ))}
                        </PlayersList>
                    )}
                </Card>
            </Section>

            {/* MediaViewer for Kicker Avatar */}
            {showAvatarViewer && (
                <MediaViewer
                    src={kickerAvatarSrc}
                    alt={kickerData?.name}
                    onClose={() => setShowAvatarViewer(false)}
                />
            )}
        </Container>
    );
}

export default KickerInfo;
