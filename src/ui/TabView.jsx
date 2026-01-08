import { NavLink, useLocation } from "react-router-dom";
import styled from "styled-components";
import { media } from "../utils/constants";
import { useEffect, useRef, useState } from "react";

const StyledTabView = styled.div`
    display: block;
`;

const TabHeaderWrapper = styled.div`
    position: relative;

    &::before,
    &::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        width: 24px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 2;
    }

    &::before {
        left: 0;
        background: linear-gradient(
            to right,
            var(--secondary-background-color),
            transparent
        );
    }

    &::after {
        right: 0;
        background: linear-gradient(
            to left,
            var(--secondary-background-color),
            transparent
        );
    }

    &.show-left::before {
        opacity: 1;
    }

    &.show-right::after {
        opacity: 1;
    }
`;

const TabHeader = styled.div`
    display: flex;
    height: 48px;
    background-color: transparent;
    border-bottom: 1px solid var(--color-grey-100);

    ${media.tablet} {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;

        &::-webkit-scrollbar {
            display: none;
        }
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
`;

const TabItem = styled(NavLink)`
    padding: 0.8rem 1.2rem;
    position: relative;
    color: var(--color-grey-500);
    flex-shrink: 0;
    white-space: nowrap;

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
    padding: 1rem 0;

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
    const tabHeaderRef = useRef(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    useEffect(() => {
        const el = tabHeaderRef.current;
        if (!el) return;

        const updateShadows = () => {
            const { scrollLeft, scrollWidth, clientWidth } = el;
            setShowLeft(scrollLeft > 0);
            setShowRight(scrollLeft + clientWidth < scrollWidth - 1);
        };

        updateShadows();
        el.addEventListener("scroll", updateShadows);
        window.addEventListener("resize", updateShadows);

        return () => {
            el.removeEventListener("scroll", updateShadows);
            window.removeEventListener("resize", updateShadows);
        };
    }, []);

    const wrapperClasses = [
        showLeft ? "show-left" : "",
        showRight ? "show-right" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <StyledTabView>
            <TabHeaderWrapper className={wrapperClasses}>
                <TabHeader ref={tabHeaderRef}>
                    {tabs.map((tab) => (
                        <TabItem to={tab.path} key={tab.path}>
                            {tab.mobileLabel || tab.label}
                            {tab.path === location.pathname && <TabSlider />}
                        </TabItem>
                    ))}
                </TabHeader>
            </TabHeaderWrapper>

            <TabContent>
                {tabs.find((tab) => tab.path === location.pathname)?.component}
            </TabContent>
        </StyledTabView>
    );
}

export default TabView;
