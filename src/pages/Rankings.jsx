import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import styled from "styled-components";
import RankingsTable from "../features/rankings/RankingsTable";
import TeamRankingsTable from "../features/rankings/TeamRankingsTable";
import Heading from "../ui/Heading";
import TabView from "../ui/TabView";

const StyledRankings = styled.div`
    display: flex;
    flex-direction: column;
`;

function Rankings() {
    const location = useLocation();
    const navigate = useNavigate();

    // Redirect to players tab if no specific tab is selected
    useEffect(() => {
        if (location.pathname === "/rankings") {
            navigate("/rankings/players", { replace: true });
        }
    }, [location.pathname, navigate]);

    const tabs = [
        {
            path: "/rankings/players",
            label: "Players",
            component: <RankingsTable />,
        },
        {
            path: "/rankings/teams",
            label: "Teams",
            component: <TeamRankingsTable />,
        },
    ];

    return (
        <StyledRankings>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Rankings
            </Heading>
            <TabView tabs={tabs} />
        </StyledRankings>
    );
}

export default Rankings;
