import styled from "styled-components";

const Avatar = styled.img`
    display: block;
    width: ${(props) =>
        props.$size === "sm"
            ? "3.4rem"
            : props.$size === "xs"
            ? "2.6rem"
            : "10rem"};
    aspect-ratio: 1;
    object-fit: cover;
    object-position: center;
    border-radius: 50%;
    outline: 2px solid var(--color-grey-100);
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
    ${(props) => (props.$cursor === "pointer" ? "cursor: pointer;" : "")}

    border: 2px solid var(--color-grey-300);
    transition: transform 0.3s;

    &:hover {
        transform: scale(1.15);
    }
`;

Avatar.defaultProps = {
    $size: "lg",
    $cursor: "none",
};

export default Avatar;
