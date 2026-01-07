import styled from "styled-components";

const TeamLogoContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-direction: ${(props) => (props.$team === "1" ? "row-reverse" : "row")};
`;

export default TeamLogoContainer;
