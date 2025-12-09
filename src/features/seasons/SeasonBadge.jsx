import styled, { css } from "styled-components";
import { useCurrentSeason } from "./useCurrentSeason";
import SpinnerMini from "../../ui/SpinnerMini";

const StyledBadge = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 0.4rem 1rem;
    border-radius: 1rem;
    font-size: 1.2rem;
    font-weight: 500;
    white-space: nowrap;

    ${(props) =>
        props.$isActive
            ? css`
                  background-color: var(--color-brand-500);
                  color: var(--color-brand-50);
                  border: 1px solid var(--color-brand-600);
              `
            : css`
                  background-color: var(--color-grey-200);
                  color: var(--color-grey-500);
                  border: 1px solid var(--color-grey-300);
              `}
`;

function SeasonBadge() {
    const { currentSeason, isLoading } = useCurrentSeason();

    if (isLoading) {
        return <SpinnerMini />;
    }

    const isActive = !!currentSeason;
    const displayName = currentSeason?.name || "Off-Season";

    return <StyledBadge $isActive={isActive}>{displayName}</StyledBadge>;
}

export default SeasonBadge;
