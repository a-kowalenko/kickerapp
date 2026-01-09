import styled from "styled-components";
import { media } from "../utils/constants";

const StyledEmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4.8rem 2.4rem;
    text-align: center;
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);

    ${media.tablet} {
        padding: 3.2rem 2rem;
        border-radius: var(--border-radius-sm);
    }

    ${media.mobile} {
        padding: 2.4rem 1.6rem;
        border-radius: 0;
        border-left: none;
        border-right: none;
    }
`;

const EmptyIcon = styled.span`
    font-size: 4.8rem;
    margin-bottom: 1.6rem;
    opacity: 0.7;

    ${media.mobile} {
        font-size: 4rem;
        margin-bottom: 1.2rem;
    }
`;

const EmptyTitle = styled.h3`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--color-grey-700);
    margin-bottom: 0.8rem;

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const EmptyDescription = styled.p`
    font-size: 1.4rem;
    color: var(--color-grey-500);
    max-width: 40rem;
    line-height: 1.6;
    margin-bottom: 0;

    ${media.mobile} {
        font-size: 1.3rem;
    }
`;

const EmptyActions = styled.div`
    display: flex;
    gap: 1.2rem;
    margin-top: 2rem;

    ${media.mobile} {
        flex-direction: column;
        width: 100%;
        margin-top: 1.6rem;
    }
`;

function EmptyState({ icon, title, description, children }) {
    return (
        <StyledEmptyState>
            {icon && <EmptyIcon>{icon}</EmptyIcon>}
            {title && <EmptyTitle>{title}</EmptyTitle>}
            {description && <EmptyDescription>{description}</EmptyDescription>}
            {children && <EmptyActions>{children}</EmptyActions>}
        </StyledEmptyState>
    );
}

export default EmptyState;
