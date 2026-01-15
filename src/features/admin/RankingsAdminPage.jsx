import styled from "styled-components";
import { useState } from "react";
import { HiOutlineUserCircle, HiOutlineUserGroup } from "react-icons/hi2";
import Spinner from "../../ui/Spinner";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import { useUser } from "../authentication/useUser";
import PlayerRankingsTab from "./PlayerRankingsTab";
import TeamRankingsTab from "./TeamRankingsTab";

const StyledAdmin = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
`;

const AccessDenied = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    text-align: center;
    color: var(--tertiary-text-color);

    h2 {
        margin-bottom: 1rem;
    }
`;

const TabContainer = styled.div`
    display: flex;
    gap: 0.8rem;
    margin-bottom: 2.4rem;
    border-bottom: 2px solid var(--color-grey-200);
    padding-bottom: 0.4rem;
`;

const Tab = styled.button`
    padding: 1rem 2rem;
    font-size: 1.4rem;
    font-weight: 500;
    border: none;
    background: none;
    cursor: pointer;
    color: ${(props) =>
        props.$active
            ? "var(--color-brand-600)"
            : "var(--secondary-text-color)"};
    border-bottom: 2px solid
        ${(props) => (props.$active ? "var(--color-brand-600)" : "transparent")};
    margin-bottom: -6px;
    transition: all 0.2s ease;

    &:hover {
        color: var(--color-brand-600);
    }

    display: flex;
    align-items: center;
    gap: 0.6rem;

    & svg {
        width: 1.8rem;
        height: 1.8rem;
    }

    @media (max-width: 600px) {
        padding: 0.8rem 1rem;
        font-size: 1.2rem;

        & svg {
            width: 1.6rem;
            height: 1.6rem;
        }
    }
`;

const TabLabel = styled.span`
    @media (max-width: 480px) {
        display: none;
    }
`;

function RankingsAdminPage() {
    const { data: kickerData, isLoading: isLoadingKicker } = useKickerInfo();
    const { user, isLoading: isLoadingUser } = useUser();

    const [activeTab, setActiveTab] = useState("player");

    const isLoading = isLoadingKicker || isLoadingUser;
    const isAdmin = kickerData?.admin === user?.id;

    if (isLoading) {
        return <Spinner />;
    }

    if (!isAdmin) {
        return (
            <AccessDenied>
                <h2>Access Denied</h2>
                <p>You must be a kicker admin to manage rankings.</p>
            </AccessDenied>
        );
    }

    return (
        <StyledAdmin>
            <TabContainer>
                <Tab
                    $active={activeTab === "player"}
                    onClick={() => setActiveTab("player")}
                >
                    <HiOutlineUserCircle /> <TabLabel>Player</TabLabel>
                </Tab>
                <Tab
                    $active={activeTab === "team"}
                    onClick={() => setActiveTab("team")}
                >
                    <HiOutlineUserGroup /> <TabLabel>Team</TabLabel>
                </Tab>
            </TabContainer>

            {activeTab === "player" && <PlayerRankingsTab />}
            {activeTab === "team" && <TeamRankingsTab />}
        </StyledAdmin>
    );
}

export default RankingsAdminPage;
