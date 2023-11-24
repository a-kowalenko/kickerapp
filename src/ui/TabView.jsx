import { NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";
import { media } from "../utils/constants";

const StyledTabView = styled.div`
    display: block;
`;

const TabHeader = styled.div`
    display: flex;
    height: 48px;
    background-color: transparent;
    border-bottom: 1px solid var(--color-grey-100);
    ${media.mobile} {
        justify-content: space-between;
    }
`;

const TabItem = styled(NavLink)`
    padding: 0.8rem 1.2rem;
    position: relative;
    color: var(--color-grey-500);

    ${media.mobile} {
        padding: 0.8rem 0.8rem;
    }

    &:hover {
        background-color: var(--tertiary-background-color);
    }

    &:active,
    &.active:link,
    &.active:visited {
        color: var(--color-grey-700);
    }

    &:active div,
    &.active:link div,
    &.active:visited div {
        background-color: currentColor;
    }
`;

const TabSliderWrapper = styled.div`
    position: absolute;
    height: 2px;
    width: 100%;
    bottom: 0;
    left: 0px;
    z-index: 1;
`;

const StyledTabSlider = styled.div`
    height: 100%;
    width: 100%;
`;

const TabContent = styled.div`
    display: block;
    background-color: transparent;
    padding: 1rem 2.4rem;

    ${media.tablet} {
        padding: 1rem 0rem;
    }
`;

function TabSlider() {
    return (
        <TabSliderWrapper>
            <StyledTabSlider />
        </TabSliderWrapper>
    );
}

function TabView({ tabs }) {
    const location = useLocation();

    return (
        <StyledTabView>
            <TabHeader>
                {tabs.map((tab) => (
                    <TabItem to={tab.path} key={tab.path}>
                        {tab.label}
                        {tab.path === location.pathname && <TabSlider />}
                    </TabItem>
                ))}
            </TabHeader>

            <TabContent>
                {tabs.find((tab) => tab.path === location.pathname)?.component}
            </TabContent>
        </StyledTabView>
    );
}

export default TabView;
