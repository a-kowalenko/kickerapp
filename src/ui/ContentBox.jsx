import styled from "styled-components";

const ContentBox = styled.div`
    background-color: white;

    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    padding: 3.2rem;
    border: 1px solid var(--color-amber-100);
    border-radius: var(--border-radius-md);
    width: 100%;
    height: 100%;
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.4);
    transition: transform 0.3s ease;

    /* &:hover {
        transform: scale(1.05);
        box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.4);
    } */
`;

export default ContentBox;
