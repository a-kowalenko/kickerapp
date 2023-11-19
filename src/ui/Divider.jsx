import styled from "styled-components";

const Divider = styled.div`
    ${(props) =>
        props.$variation === "vertical"
            ? "width: 1px;"
            : "height: 1px; width: 100%;"}
    background-color: var(--primary-border-color);
`;

export default Divider;
