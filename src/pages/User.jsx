import { useParams } from "react-router-dom";
import { useUser } from "../features/authentication/useUser";
import Profile from "../features/players/Profile";
import Heading from "../ui/Heading";
import TabView from "../ui/TabView";
import Spinner from "../ui/Spinner";
import ProfileSettings from "../features/players/ProfileSettings";
import ProfileMatches from "../features/players/ProfileMatches";
import PlayerStatistics from "../features/players/PlayerStatistics";

function User() {
    const { userId } = useParams();
    const { user, isLoading } = useUser();

    if (isLoading) {
        return <Spinner />;
    }

    const {
        user_metadata: { username },
    } = user;

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
            <Heading as="h1" hasBackBtn={true} backDirection="/home" $uppercase>
                Profile of {userId}
            </Heading>

            <TabView tabs={tabs} />
        </>
    );
}

export default User;
