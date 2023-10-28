import styled from "styled-components";

const Avatar = styled.img`
    display: block;
    width: 10rem;
    aspect-ratio: 1;
    object-fit: cover;
    object-position: center;
    border-radius: 50%;
    outline: 2px solid var(--color-grey-100);
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);

    border: 2px solid var(--color-grey-300);
    transition: transform 0.3s;

    &:hover {
        transform: scale(1.15);
    }
`;

export default Avatar;
