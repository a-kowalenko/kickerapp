import styled, { keyframes } from "styled-components";
import {
    HiOutlineTrophy,
    HiOutlineUsers,
    HiOutlineBolt,
} from "react-icons/hi2";
import { PiSoccerBallThin } from "react-icons/pi";
import { media } from "../../utils/constants";
import SpinnerMini from "../../ui/SpinnerMini";
import { usePublicStats } from "./usePublicStats";

const countUp = keyframes`
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
`;

const Section = styled.section`
    padding: 2rem 4rem;
    max-width: 90rem;
    margin: 0 auto;

    ${media.tablet} {
        padding: 2rem 2rem;
    }

    ${media.mobile} {
        padding: 1.5rem 1.5rem;
    }
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;

    @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
    }

    ${media.mobile} {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
`;

const StatCard = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    padding: 1.4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: transform 0.2s ease;

    &:hover {
        transform: translateY(-2px);
    }

    ${media.tablet} {
        padding: 1.2rem;
    }
`;

const IconWrapper = styled.div`
    width: 3.6rem;
    height: 3.6rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
        135deg,
        var(--color-${(props) => props.$color}-100) 0%,
        var(--color-${(props) => props.$color}-200) 100%
    );

    & svg {
        width: 1.8rem;
        height: 1.8rem;
        color: var(--color-${(props) => props.$color}-600);
    }
`;

const StatTitle = styled.span`
    font-size: 1.1rem;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--color-grey-500);
    letter-spacing: 0.03em;
    text-align: center;

    ${media.tablet} {
        font-size: 1rem;
    }
`;

const StatValue = styled.span`
    font-weight: 700;
    font-size: 2.2rem;
    line-height: 1;
    color: var(--primary-text-color);
    animation: ${countUp} 0.4s ease-out;

    ${media.tablet} {
        font-size: 1.8rem;
    }
`;

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num?.toLocaleString() ?? "0";
}

function PublicStats() {
    const { stats, isLoading, error } = usePublicStats();

    // Don't show section if there's an error (fail silently for public stats)
    if (error) return null;

    const statsConfig = [
        {
            icon: <PiSoccerBallThin />,
            title: "Matches Played",
            value: stats?.total_matches,
            color: "blue",
        },
        {
            icon: <HiOutlineUsers />,
            title: "Active Players",
            value: stats?.total_players,
            color: "green",
        },
        {
            icon: <HiOutlineBolt />,
            title: "Goals Scored",
            value: stats?.total_goals,
            color: "yellow",
        },
        {
            icon: <HiOutlineTrophy />,
            title: "Active Kickers",
            value: stats?.total_kickers,
            color: "indigo",
        },
    ];

    return (
        <Section>
            <StatsGrid>
                {statsConfig.map((stat) => (
                    <StatCard key={stat.title}>
                        <IconWrapper $color={stat.color}>
                            {stat.icon}
                        </IconWrapper>
                        <StatTitle>{stat.title}</StatTitle>
                        <StatValue>
                            {isLoading ? (
                                <SpinnerMini />
                            ) : (
                                formatNumber(stat.value)
                            )}
                        </StatValue>
                    </StatCard>
                ))}
            </StatsGrid>
        </Section>
    );
}

export default PublicStats;
