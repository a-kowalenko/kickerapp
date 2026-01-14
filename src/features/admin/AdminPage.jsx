import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Heading from "../../ui/Heading";
import Spinner from "../../ui/Spinner";
import TabView from "../../ui/TabView";
import AchievementAdminPage from "../achievements/admin/AchievementAdminPage";
import StatusAdminPage from "../achievements/admin/StatusAdminPage";
import MatchesAdminTab from "./MatchesAdminTab";
import RankingsAdminPage from "./RankingsAdminPage";
import SeasonManagement from "../seasons/SeasonManagement";
import KickerSettings from "../settings/KickerSettings";
import UserPermissionsManager from "../settings/UserPermissionsManager";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import { useUser } from "../authentication/useUser";

const StyledAdmin = styled.div`
    display: flex;
    flex-direction: column;
`;

function AdminPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { data: kickerData, isLoading: isLoadingKicker } = useKickerInfo();
    const { user, isLoading: isLoadingUser } = useUser();

    const isAdmin = kickerData?.admin === user?.id;

    // Redirect non-admins to home
    useEffect(() => {
        if (!isLoadingKicker && !isLoadingUser && !isAdmin) {
            navigate("/home", { replace: true });
        }
    }, [isAdmin, isLoadingKicker, isLoadingUser, navigate]);

    // Redirect to achievements tab if on base /admin path
    useEffect(() => {
        if (location.pathname === "/admin") {
            navigate("/admin/achievements", { replace: true });
        }
    }, [location.pathname, navigate]);

    if (isLoadingKicker || isLoadingUser) {
        return <Spinner />;
    }

    if (!isAdmin) {
        return null;
    }

    // Admin tabs - can be extended with more admin features in the future
    const tabs = [
        {
            path: "/admin/achievements",
            label: "Achievements",
            component: <AchievementAdminPage />,
        },
        {
            path: "/admin/status",
            label: "Status",
            component: <StatusAdminPage />,
        },
        {
            path: "/admin/matches",
            label: "Matches",
            component: <MatchesAdminTab />,
        },
        {
            path: "/admin/rankings",
            label: "Rankings",
            component: <RankingsAdminPage />,
        },
        {
            path: "/admin/seasons",
            label: "Seasons",
            component: <SeasonManagement />,
        },
        {
            path: "/admin/kicker",
            label: "Kicker",
            component: <KickerSettings />,
        },
        {
            path: "/admin/permissions",
            label: "Permissions",
            component: <UserPermissionsManager />,
        },
    ];

    return (
        <StyledAdmin>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Admin
            </Heading>
            <TabView tabs={tabs} />
        </StyledAdmin>
    );
}

export default AdminPage;
