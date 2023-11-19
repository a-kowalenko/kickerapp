import styled from "styled-components";

const ContentBox = styled.div`
    background-color: var(--color-grey-0);

    display: flex;
    flex-direction: ${(props) =>
        props.type === "horizontal" ? "row" : "column"};
    gap: 2.4rem;
    padding: 3.2rem;
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    width: 100%;
    height: 100%;
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease;
`;

export default ContentBox;
