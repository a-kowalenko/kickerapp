import styled from "styled-components";

const DefaultTeamLogo = styled.div`
    width: 3.2rem;
    height: 3.2rem;
    border-radius: var(--border-radius-sm);
    background: linear-gradient(
        135deg,
        var(--color-brand-100) 0%,
        var(--color-brand-200) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--color-brand-700);
    border: 1px solid var(--color-grey-300);
`;

export default DefaultTeamLogo;
