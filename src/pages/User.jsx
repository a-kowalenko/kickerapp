import { useParams } from "react-router-dom";
import { useUser } from "../features/authentication/useUser";
import styled from "styled-components";
import Profile from "../features/players/Profile";
import Row from "../ui/Row";
import Heading from "../ui/Heading";
import TabView from "../ui/TabView";
import Spinner from "../ui/Spinner";
import ProfileSettings from "../features/players/ProfileSettings";
import ProfileMatches from "../features/players/ProfileMatches";
import PlayerStatistics from "../features/players/PlayerStatistics";

const StyledUser = styled.div`
    /* display: flex;
    gap: 12rem; */
`;

function User() {
    const { userId } = useParams();
    const { user, isLoading } = useUser();

    if (!user) {
        return <Spinner />;
    }

    const {
        user_metadata: { username },
    } = user;

    const ownAccount = userId === username;

    if (isLoading) {
        return <Spinner />;
    }

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
            <Row type="horizontal">
                <Heading as="h1" $uppercase>
                    Profile of {userId}
                </Heading>
            </Row>
            <TabView tabs={tabs} />
        </>
    );
}

export default User;
