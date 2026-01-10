import {
    useParams,
    useSearchParams,
    useNavigate,
    Link,
} from "react-router-dom";
import { useQuery } from "react-query";
import styled from "styled-components";
import { getKickerInvitePreview } from "../services/apiKicker";
import { useUser } from "../features/authentication/useUser";
import { useJoinKicker } from "../features/kicker/useJoinKicker";
import { useKicker } from "../contexts/KickerContext";
import Spinner from "../ui/Spinner";
import Button from "../ui/Button";
import { DEFAULT_AVATAR } from "../utils/constants";
import { media } from "../utils/constants";
import {
    HiOutlineUserGroup,
    HiOutlineUserPlus,
    HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import { useState } from "react";

const PageContainer = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background-color: var(--primary-background-color);
`;

const InviteCard = styled.div`
    max-width: 48rem;
    width: 100%;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--primary-border-color);
    padding: 3.2rem;
    text-align: center;

    ${media.mobile} {
        padding: 2rem;
    }
`;

const KickerAvatar = styled.img`
    width: 10rem;
    height: 10rem;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--primary-button-color);
    margin-bottom: 1.6rem;
`;

const KickerName = styled.h1`
    font-size: 2.8rem;
    font-weight: 700;
    color: var(--primary-text-color);
    margin-bottom: 0.8rem;
`;

const InviteMessage = styled.p`
    font-size: 1.6rem;
    color: var(--secondary-text-color);
    margin-bottom: 2.4rem;
`;

const InviterSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.2rem;
    margin-bottom: 2.4rem;
    padding: 1.2rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-md);
`;

const InviterAvatar = styled.img`
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    object-fit: cover;
`;

const InviterInfo = styled.div`
    text-align: left;
`;

const InviterLabel = styled.span`
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
    display: block;
`;

const InviterName = styled.span`
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const PlayersSection = styled.div`
    margin-bottom: 2.4rem;
`;

const PlayersTitle = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    font-size: 1.3rem;
    color: var(--secondary-text-color);
    margin-bottom: 1.2rem;

    & svg {
        font-size: 1.6rem;
    }
`;

const PlayersList = styled.div`
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
`;

const PlayerChip = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1.2rem;
    background-color: var(--tertiary-background-color);
    border-radius: 2rem;
    font-size: 1.2rem;
    color: var(--primary-text-color);
`;

const PlayerChipAvatar = styled.img`
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    object-fit: cover;
`;

const ButtonsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const ActionButton = styled(Button)`
    width: 100%;
    justify-content: center;
    gap: 0.8rem;
    padding: 1.2rem 2rem;
    font-size: 1.5rem;
`;

const SecondaryActions = styled.div`
    display: flex;
    gap: 1rem;
    margin-top: 0.8rem;

    ${media.mobile} {
        flex-direction: column;
    }
`;

const SecondaryButton = styled(Button)`
    flex: 1;
    justify-content: center;
    gap: 0.6rem;
`;

const ErrorCard = styled(InviteCard)`
    text-align: center;
`;

const ErrorTitle = styled.h2`
    font-size: 2rem;
    color: var(--color-red-700);
    margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
    font-size: 1.4rem;
    color: var(--secondary-text-color);
    margin-bottom: 2rem;
`;

const HomeLink = styled(Link)`
    color: var(--primary-button-color);
    font-size: 1.4rem;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const AlreadyMemberMessage = styled.div`
    font-size: 1.4rem;
    color: var(--color-green-700);
    background-color: var(--color-green-100);
    padding: 1.2rem;
    border-radius: var(--border-radius-sm);
    margin-bottom: 1.6rem;
`;

function InvitePage() {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const inviterId = searchParams.get("from");
    const navigate = useNavigate();

    const { user, isLoading: isLoadingUser } = useUser();
    const { setCurrentKicker } = useKicker();
    const { joinKicker, isLoading: isJoining } = useJoinKicker();

    const [alreadyMember, setAlreadyMember] = useState(false);

    // Fetch kicker preview
    const {
        data: preview,
        isLoading: isLoadingPreview,
        error: previewError,
    } = useQuery({
        queryKey: ["kickerInvitePreview", token, inviterId],
        queryFn: () =>
            getKickerInvitePreview({
                token,
                inviterId: inviterId ? parseInt(inviterId, 10) : null,
            }),
        retry: false,
    });

    // Handle join kicker for authenticated users
    function handleJoinKicker() {
        joinKicker(
            { accessToken: token },
            {
                onSuccess: (kicker) => {
                    setCurrentKicker(kicker.id);
                    toast.success(`Welcome to ${preview?.kicker_name}!`);
                    navigate("/home");
                },
                onError: (error) => {
                    if (error.message?.includes("already a member")) {
                        setAlreadyMember(true);
                        // Auto-select this kicker and navigate
                        setCurrentKicker(preview?.kicker_id);
                        setTimeout(() => navigate("/home"), 2000);
                    } else {
                        toast.error(error.message);
                    }
                },
            }
        );
    }

    // Handle redirect to register with pending invite
    function handleRegisterAndJoin() {
        // Write directly to localStorage (sync) instead of using the hook (async via useEffect)
        localStorage.setItem(
            "pendingInvite",
            JSON.stringify({
                token,
                kickerName: preview?.kicker_name,
                kickerId: preview?.kicker_id,
            })
        );
        navigate("/register");
    }

    // Handle redirect to login with pending invite
    function handleLoginAndJoin() {
        // Write directly to localStorage (sync) instead of using the hook (async via useEffect)
        localStorage.setItem(
            "pendingInvite",
            JSON.stringify({
                token,
                kickerName: preview?.kicker_name,
                kickerId: preview?.kicker_id,
            })
        );
        navigate("/login");
    }

    // Loading state
    if (isLoadingPreview || isLoadingUser) {
        return (
            <PageContainer>
                <Spinner />
            </PageContainer>
        );
    }

    // Error state - invalid token
    if (previewError) {
        return (
            <PageContainer>
                <ErrorCard>
                    <ErrorTitle>Invalid Invitation</ErrorTitle>
                    <ErrorMessage>
                        This invitation link is invalid or has expired.
                        <br />
                        Please ask for a new invitation link.
                    </ErrorMessage>
                    <HomeLink to="/">Go to Homepage</HomeLink>
                </ErrorCard>
            </PageContainer>
        );
    }

    const hasInviter = preview?.inviter_name;
    const samplePlayers = preview?.sample_players || [];
    const playerCount = preview?.player_count || 0;

    return (
        <PageContainer>
            <InviteCard>
                <KickerAvatar
                    src={preview?.kicker_avatar || DEFAULT_AVATAR}
                    alt={preview?.kicker_name}
                />
                <KickerName>{preview?.kicker_name}</KickerName>
                <InviteMessage>
                    {hasInviter
                        ? `You've been invited to join this kicker!`
                        : `You've been invited to join this kicker!`}
                </InviteMessage>

                {/* Inviter info */}
                {hasInviter && (
                    <InviterSection>
                        <InviterAvatar
                            src={preview?.inviter_avatar || DEFAULT_AVATAR}
                            alt={preview?.inviter_name}
                        />
                        <InviterInfo>
                            <InviterLabel>Invited by</InviterLabel>
                            <InviterName>{preview?.inviter_name}</InviterName>
                        </InviterInfo>
                    </InviterSection>
                )}

                {/* Sample players */}
                {samplePlayers.length > 0 && (
                    <PlayersSection>
                        <PlayersTitle>
                            <HiOutlineUserGroup />
                            {playerCount} player{playerCount !== 1 ? "s" : ""}{" "}
                            already joined
                        </PlayersTitle>
                        <PlayersList>
                            {samplePlayers.map((player, index) => (
                                <PlayerChip key={index}>
                                    <PlayerChipAvatar
                                        src={player.avatar || DEFAULT_AVATAR}
                                        alt={player.name}
                                    />
                                    {player.name}
                                </PlayerChip>
                            ))}
                            {playerCount > samplePlayers.length && (
                                <PlayerChip>
                                    +{playerCount - samplePlayers.length} more
                                </PlayerChip>
                            )}
                        </PlayersList>
                    </PlayersSection>
                )}

                {/* Already member message */}
                {alreadyMember && (
                    <AlreadyMemberMessage>
                        You&apos;re already a member of this kicker!
                        Redirecting...
                    </AlreadyMemberMessage>
                )}

                {/* Action buttons */}
                <ButtonsContainer>
                    {user ? (
                        // Authenticated user - direct join
                        <ActionButton
                            $variation="primary"
                            $size="large"
                            onClick={handleJoinKicker}
                            disabled={isJoining || alreadyMember}
                        >
                            <HiOutlineUserPlus />
                            {isJoining ? "Joining..." : "Join Kicker"}
                        </ActionButton>
                    ) : (
                        // Not authenticated - register or login
                        <>
                            <ActionButton
                                $variation="primary"
                                $size="large"
                                onClick={handleRegisterAndJoin}
                            >
                                <HiOutlineUserPlus />
                                Register & Join
                            </ActionButton>
                            <SecondaryActions>
                                <SecondaryButton
                                    $variation="secondary"
                                    $size="medium"
                                    onClick={handleLoginAndJoin}
                                >
                                    <HiOutlineArrowRightOnRectangle />
                                    Login & Join
                                </SecondaryButton>
                            </SecondaryActions>
                        </>
                    )}
                </ButtonsContainer>
            </InviteCard>
        </PageContainer>
    );
}

export default InvitePage;
