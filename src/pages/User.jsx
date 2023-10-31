import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../features/authentication/useUser";
import styled from "styled-components";
import Profile from "../features/players/Profile";
import Row from "../ui/Row";
import Heading from "../ui/Heading";
import TabView from "../ui/TabView";
import { usePlayerName } from "../features/players/usePlayerName";
import Spinner from "../ui/Spinner";
import UserDataForm from "../features/authentication/UserDataForm";
import ProfileSettings from "../features/players/ProfileSettings";
import { useEffect, useMemo } from "react";

const StyledUser = styled.div`
    /* display: flex;
    gap: 12rem; */
`;

function User() {
    const { userId } = useParams();
    const {
        user: {
            email,
            user_metadata: { username, avatar },
        },
    } = useUser();

    const ownAccount = userId === username;

    const { player, isLoading } = usePlayerName(userId);

    if (isLoading) {
        return <Spinner />;
    }

    const tabs = [
        {
            path: `/user/${userId}/profile`,
            label: "Profile",
            component: <Profile player={player} />,
        },
        {
            path: `/user/${userId}/history`,
            label: "Match History",
            component: <div>History Content</div>,
        },
        {
            path: `/user/${userId}/statistics`,
            label: "Statistics",
            component: <div>Statistics Content</div>,
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
