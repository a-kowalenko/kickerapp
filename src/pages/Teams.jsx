import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Heading from "../ui/Heading";
import TabView from "../ui/TabView";
import MyTeamsTab from "../features/teams/MyTeamsTab";
import AllTeamsTab from "../features/teams/AllTeamsTab";
import DissolvedTeamsTab from "../features/teams/DissolvedTeamsTab";

const StyledTeams = styled.div`
    display: flex;
    flex-direction: column;
`;

function Teams() {
    const location = useLocation();
    const navigate = useNavigate();

    // Redirect to my teams tab if no specific tab is selected
    useEffect(() => {
        if (location.pathname === "/teams") {
            navigate("/teams/my", { replace: true });
        }
    }, [location.pathname, navigate]);

    const tabs = [
        {
            path: "/teams/my",
            label: "My Teams",
            component: <MyTeamsTab />,
        },
        {
            path: "/teams/all",
            label: "All Teams",
            component: <AllTeamsTab />,
        },
        {
            path: "/teams/dissolved",
            label: "Dissolved",
            component: <DissolvedTeamsTab />,
        },
    ];

    return (
        <StyledTeams>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Teams
            </Heading>
            <TabView tabs={tabs} />
        </StyledTeams>
    );
}

export default Teams;
