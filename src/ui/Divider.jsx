import styled from "styled-components";

const Divider = styled.div`
    ${(props) =>
        props.$variation === "vertical"
            ? "width: 1px; align-self: stretch; justify-self: center;"
            : "height: 1px; width: 100%;"}
    background-color: var(--primary-border-color);
`;

export default Divider;
