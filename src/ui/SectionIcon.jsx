import styled from "styled-components";

const SettingIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.8rem;
    height: 4.8rem;
    border-radius: 50%;
    background-color: var(--secondary-background-color);
    color: var(--primary-button-color);
    flex-shrink: 0;

    & svg {
        font-size: 2.4rem;
    }
`;

export default SettingIcon;
