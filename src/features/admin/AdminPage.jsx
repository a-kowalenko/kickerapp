import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { HiShieldCheck } from "react-icons/hi2";
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

const TabLabel = styled.span`
    display: flex;
    align-items: center;
    gap: 0.4rem;
`;

const SuperAdminIcon = styled(HiShieldCheck)`
    color: var(--color-brand-600);
    font-size: 1.4rem;
`;

// Paths that require SUPERADMIN access
const SUPERADMIN_ONLY_PATHS = [
    "/admin/achievements",
    "/admin/status",
    "/admin/permissions",
];

function AdminPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { data: kickerData, isLoading: isLoadingKicker } = useKickerInfo();
    const { user, isLoading: isLoadingUser, isSuperAdmin } = useUser();

    const isKickerAdmin = kickerData?.admin === user?.id;
    const isAdmin = isKickerAdmin || isSuperAdmin;

    // Redirect non-admins to home
    useEffect(() => {
        if (!isLoadingKicker && !isLoadingUser && !isAdmin) {
            navigate("/home", { replace: true });
        }
    }, [isAdmin, isLoadingKicker, isLoadingUser, navigate]);

    // Redirect non-superadmins trying to access superadmin-only paths
    useEffect(() => {
        if (
            !isLoadingKicker &&
            !isLoadingUser &&
            isAdmin &&
            !isSuperAdmin &&
            SUPERADMIN_ONLY_PATHS.includes(location.pathname)
        ) {
            navigate("/admin/matches", { replace: true });
        }
    }, [
        isAdmin,
        isSuperAdmin,
        isLoadingKicker,
        isLoadingUser,
        location.pathname,
        navigate,
    ]);

    // Redirect to appropriate default tab based on access level
    useEffect(() => {
        if (location.pathname === "/admin") {
            if (isSuperAdmin) {
                navigate("/admin/achievements", { replace: true });
            } else {
                navigate("/admin/matches", { replace: true });
            }
        }
    }, [location.pathname, isSuperAdmin, navigate]);

    if (isLoadingKicker || isLoadingUser) {
        return <Spinner />;
    }

    if (!isAdmin) {
        return null;
    }

    // Helper to create tab label with optional superadmin icon
    const createLabel = (text, isSuperAdminOnly) => (
        <TabLabel>
            {isSuperAdminOnly && <SuperAdminIcon title="Nur für Superadmin" />}
            {text}
        </TabLabel>
    );

    // All admin tabs
    const allTabs = [
        {
            path: "/admin/kicker",
            label: "Kicker",
            component: <KickerSettings />,
            superAdminOnly: false,
        },
        {
            path: "/admin/seasons",
            label: "Seasons",
            component: <SeasonManagement />,
            superAdminOnly: false,
        },
        {
            path: "/admin/rankings",
            label: "Rankings",
            component: <RankingsAdminPage />,
            superAdminOnly: false,
        },
        {
            path: "/admin/matches",
            label: "Matches",
            component: <MatchesAdminTab />,
            superAdminOnly: false,
        },
        {
            path: "/admin/status",
            label: createLabel("Status", true),
            component: <StatusAdminPage />,
            superAdminOnly: true,
        },
        {
            path: "/admin/achievements",
            label: createLabel("Achievements", true),
            component: <AchievementAdminPage />,
            superAdminOnly: true,
        },
        {
            path: "/admin/permissions",
            label: createLabel("Permissions", true),
            component: <UserPermissionsManager />,
            superAdminOnly: true,
        },
    ];

    // Filter tabs based on access level
    const tabs = allTabs.filter((tab) => !tab.superAdminOnly || isSuperAdmin);

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
