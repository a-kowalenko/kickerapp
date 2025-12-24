import { useParams } from "react-router-dom";
import Profile from "../features/players/Profile";
import Heading from "../ui/Heading";
import TabView from "../ui/TabView";
import Spinner from "../ui/Spinner";
import ProfileSettings from "../features/players/ProfileSettings";
import ProfileMatches from "../features/players/ProfileMatches";
import ProfileAchievements from "../features/players/ProfileAchievements";
import PlayerStatistics from "../features/players/PlayerStatistics";
import { useOwnPlayer } from "../hooks/useOwnPlayer";
import { usePrefetchProfileData } from "../features/players/usePrefetchProfileData";

function User() {
    const { userId } = useParams();
    const { data: player, isLoading } = useOwnPlayer();
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
            component: <PlayerStatistics />,
        },
    ];

    if (ownAccount) {
        tabs.push({
            path: `/user/${userId}/settings`,
            label: "Settings",
            component: <ProfileSettings />,
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
