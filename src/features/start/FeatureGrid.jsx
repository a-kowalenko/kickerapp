import styled, { keyframes } from "styled-components";
import {
    HiOutlineTrophy,
    HiOutlineChartBar,
    HiOutlineStar,
    HiOutlineUserGroup,
} from "react-icons/hi2";
import { media } from "../../utils/constants";

const fadeInUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const Section = styled.section`
    padding: 3rem 0;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
    padding: 0 4rem;
    margin: 2rem auto 0;
    max-width: 120rem;

    @media (max-width: 1100px) {
        grid-template-columns: repeat(2, 1fr);
    }

    ${media.tablet} {
        grid-template-columns: repeat(2, 1fr);
        padding: 0 2rem;
        gap: 1.5rem;
    }

    ${media.mobile} {
        grid-template-columns: 1fr;
        padding: 0 1.5rem;
    }
`;

const FeatureCard = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-lg);
    padding: 2.4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: transform 0.3s ease, box-shadow 0.3s ease,
        border-color 0.3s ease;

    &:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    }

    ${media.tablet} {
        padding: 1.6rem;
    }
`;

const IconWrapper = styled.div`
    width: 6rem;
    height: 6rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
        135deg,
        var(--color-${(props) => props.$color}-100) 0%,
        var(--color-${(props) => props.$color}-200) 100%
    );
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    & svg {
        width: 3rem;
        height: 3rem;
        color: var(--color-${(props) => props.$color}-600);
        transition: transform 0.3s ease;
    }

    ${FeatureCard}:hover & {
        transform: scale(1.05);
        box-shadow: 0 4px 12px var(--color-${(props) => props.$color}-200);
    }

    ${FeatureCard}:hover & svg {
        transform: scale(1.1);
    }

    ${media.tablet} {
        width: 5rem;
        height: 5rem;

        & svg {
            width: 2.4rem;
            height: 2.4rem;
        }
    }
`;

const FeatureTitle = styled.h3`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;

    ${media.tablet} {
        font-size: 1.6rem;
    }
`;

const FeatureDescription = styled.p`
    font-size: 1.4rem;
    color: var(--secondary-text-color);
    margin: 0;
    line-height: 1.5;

    ${media.tablet} {
        font-size: 1.3rem;
    }
`;

const SectionTitle = styled.h2`
    font-size: 2.4rem;
    color: var(--primary-text-color);
    margin-bottom: 0.5rem;
    text-align: center;

    ${media.tablet} {
        font-size: 2rem;
    }
`;

const SectionSubtitle = styled.p`
    font-size: 1.5rem;
    color: var(--secondary-text-color);
    text-align: center;
    margin-bottom: 1rem;

    ${media.tablet} {
        font-size: 1.3rem;
    }
`;

const features = [
    {
        icon: <HiOutlineTrophy />,
        title: "MMR Rankings",
        description:
            "Compete with friends using our skill-based rating system. Track your progress and climb the leaderboard.",
        color: "yellow",
    },
    {
        icon: <HiOutlineChartBar />,
        title: "Detailed Statistics",
        description:
            "Analyze your performance with comprehensive stats, charts, and match history.",
        color: "blue",
    },
    {
        icon: <HiOutlineStar />,
        title: "Achievements",
        description:
            "Unlock badges and achievements as you play. Show off your accomplishments to others.",
        color: "green",
    },
    {
        icon: <HiOutlineUserGroup />,
        title: "Teams & Seasons",
        description:
            "Create permanent teams, compete in seasons, and track your team's performance over time.",
        color: "indigo",
    },
];

function FeatureGrid() {
    return (
        <Section>
            <SectionTitle>Everything you need</SectionTitle>
            <SectionSubtitle>
                Powerful features to track your table football games
            </SectionSubtitle>
            <Grid>
                {features.map((feature) => (
                    <FeatureCard key={feature.title}>
                        <IconWrapper $color={feature.color}>
                            {feature.icon}
                        </IconWrapper>
                        <FeatureTitle>{feature.title}</FeatureTitle>
                        <FeatureDescription>
                            {feature.description}
                        </FeatureDescription>
                    </FeatureCard>
                ))}
            </Grid>
        </Section>
    );
}

export default FeatureGrid;
