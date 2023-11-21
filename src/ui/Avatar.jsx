import styled, { css } from "styled-components";

const Avatar = styled.img`
    display: block;
    ${(props) => sizes[props.$size]}
    aspect-ratio: 1;
    object-fit: cover;
    object-position: center;
    border-radius: 50%;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
    ${(props) => (props.$cursor === "pointer" ? "cursor: pointer;" : "")}

    border: 1px solid var(--primary-border-color);
    transition: transform 0.3s;

    &:hover {
        transform: scale(1.15);
    }
`;

Avatar.defaultProps = {
    $size: "large",
    $cursor: "none",
};

const sizes = {
    xs: css`
        width: 2.6rem;
        height: 2.6rem;
    `,
    small: css`
        width: 3.4rem;
        height: 3.4rem;
    `,
    large: css`
        width: 10rem;
        height: 10rem;
    `,
    huge: css`
        width: 30rem;
        height: 30rem;
    `,
};

export default Avatar;
