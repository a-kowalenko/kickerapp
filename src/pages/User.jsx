import { useParams } from "react-router-dom";
import Profile from "../features/players/Profile";
import Heading from "../ui/Heading";
import TabView from "../ui/TabView";
import Spinner from "../ui/Spinner";
import ProfileMatches from "../features/players/ProfileMatches";
import AchievementsOverview from "../features/achievements/AchievementsOverview";
import RewardsOverview from "../features/achievements/RewardsOverview";
import PlayerStatistics from "../features/players/PlayerStatistics";
import { useOwnPlayer } from "../hooks/useOwnPlayer";
import { usePlayerName } from "../features/players/usePlayerName";
import { usePrefetchProfileData } from "../features/players/usePrefetchProfileData";
import useWindowWidth from "../hooks/useWindowWidth";

function User() {
    const { userId } = useParams();
    const { data: ownPlayer, isLoading: isLoadingOwnPlayer } = useOwnPlayer();
    const { player: profilePlayer, isLoading: isLoadingProfilePlayer } =
        usePlayerName(userId);
    const { isMobile } = useWindowWidth();
    usePrefetchProfileData();

    const isLoading = isLoadingOwnPlayer || isLoadingProfilePlayer;

    if (isLoading) {
        return <Spinner />;
    }

    const username = ownPlayer?.name;
    const ownAccount = userId === username;

    // Build tabs - Rewards tab only shown for own profile
    const tabs = [
        {
            path: `/user/${userId}/profile`,
            label: "Profile",
            component: <Profile />,
        },
        {
            path: `/user/${userId}/history`,
            label: "Match History",
            mobileLabel: isMobile ? "Matches" : undefined,
            component: <ProfileMatches />,
        },
        {
            path: `/user/${userId}/statistics`,
            label: "Statistics",
            mobileLabel: isMobile ? "Stats" : undefined,
            component: <PlayerStatistics />,
        },
        {
            path: `/user/${userId}/achievements`,
            label: "Achievements",
            component: <AchievementsOverview playerId={profilePlayer?.id} />,
        },
    ];

    // Add Rewards tab only for own profile
    if (ownAccount) {
        tabs.push({
            path: `/user/${userId}/rewards`,
            label: "Rewards",
            component: <RewardsOverview />,
        });
    }

    return (
        <>
            <Heading
                as="h1"
                hasBackBtn={true}
                type="page"
                backDirection="/home"
                $uppercase
            >
                Profile of {userId}
            </Heading>

            <TabView tabs={tabs} />
        </>
    );
}

export default User;
