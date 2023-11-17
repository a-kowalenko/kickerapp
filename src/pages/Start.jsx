import styled from "styled-components";
import Startpage from "../features/start/Startpage";

const StyledStart = styled.div`
    background-color: var(--secondary-background-color);
`;

function Start() {
    return (
        <StyledStart>
            <Startpage />
        </StyledStart>
    );
}

export default Start;
