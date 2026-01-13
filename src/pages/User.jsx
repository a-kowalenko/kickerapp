import { useParams } from "react-router-dom";
import Profile from "../features/players/Profile";
import Heading from "../ui/Heading";
import TabView from "../ui/TabView";
import Spinner from "../ui/Spinner";
import ProfileMatches from "../features/players/ProfileMatches";
import ProfileAchievements from "../features/players/ProfileAchievements";
import PlayerStatistics from "../features/players/PlayerStatistics";
import { useOwnPlayer } from "../hooks/useOwnPlayer";
import { usePrefetchProfileData } from "../features/players/usePrefetchProfileData";
import useWindowWidth from "../hooks/useWindowWidth";

function User() {
    const { userId } = useParams();
    const { data: player, isLoading } = useOwnPlayer();
    const { isMobile } = useWindowWidth();
    usePrefetchProfileData();

    if (isLoading) {
        return <Spinner />;
    }

    const username = player.name;

    const ownAccount = userId === username;

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
            path: `/user/${userId}/achievements`,
            label: "Achievements",
            component: <ProfileAchievements />,
        },
        {
            path: `/user/${userId}/statistics`,
            label: "Statistics",
            mobileLabel: isMobile ? "Stats" : undefined,
            component: <PlayerStatistics />,
        },
    ];

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
