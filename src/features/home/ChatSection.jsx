import styled from "styled-components";
import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import {
    HiChatBubbleLeftRight,
    HiChatBubbleOvalLeftEllipsis,
    HiOutlineTrophy,
} from "react-icons/hi2";
import { useKicker } from "../../contexts/KickerContext";
import { useUnreadCommentCount } from "./useUnreadCommentCount";
import useWindowWidth from "../../hooks/useWindowWidth";
import { useUser } from "../authentication/useUser";
import useUnreadBadge from "../../hooks/useUnreadBadge";
import { updateCommentReadStatus } from "../../services/apiComments";
import ChatTab from "./ChatTab";
import MatchCommentsTab from "./MatchCommentsTab";
import AchievementTickerTab from "./AchievementTickerTab";
import { media } from "../../utils/constants";
import ContentBox from "../../ui/ContentBox";
import CountBadge from "../../ui/CountBadge";

const CHAT_TAB_STORAGE_KEY = "zerohero-chat-active-tab";

const StyledChatSection = styled(ContentBox)`
    grid-area: 4 / 1 / 5 / 5;

    @media (max-width: 1350px) {
        grid-area: 6 / 1 / 7 / 3;
    }
`;

const ChatContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow: visible;
    height: 90rem;
    position: relative;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;

    ${media.tablet} {
        height: 80rem;
    }
`;

const TabBar = styled.div`
    display: flex;
    /* gap: 0.2rem; */
    background-color: var(--tertiary-background-color);
    /* border: 1px solid var(--primary-border-color); */
    border-bottom: none;
    border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
`;

const TabButton = styled.button`
    flex: 1;
    padding: 1rem 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    /* border: 1px solid var(--primary-border-color); */
    border: ${(props) =>
        props.$active ? "1px solid var(--primary-border-color);" : "none"};
    border-bottom: ${(props) =>
        props.$active ? "none" : "1px solid var(--primary-border-color);"};
    background-color: ${(props) =>
        props.$active ? "var(--secondary-background-color)" : "transparent"};
    color: ${(props) =>
        props.$active
            ? "var(--primary-text-color)"
            : "var(--secondary-text-color)"};
    font-size: 1.4rem;
    font-weight: ${(props) => (props.$active ? "600" : "500")};
    cursor: pointer;
    transition: all 0.2s;
    border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;

    ${(props) =>
        props.$active &&
        `
        box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
    `}

    &:hover:not([disabled]) {
        background-color: ${(props) =>
            props.$active
                ? "var(--secondary-background-color)"
                : "var(--table-row-color-hover)"};
        color: var(--primary-text-color);
    }

    & svg {
        font-size: 1.8rem;
        color: ${(props) =>
            props.$active
                ? "var(--primary-text-color)"
                : "var(--secondary-text-color)"};
        transition: color 0.2s;
    }

    &:hover svg {
        color: var(--primary-text-color);
    }
`;

const TabContent = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--primary-border-color);
    border-top: none;
    border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
    position: relative;
`;

// Keep all tabs mounted and preserve scroll position
// Using visibility instead of display to maintain scroll state
const TabPanel = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    visibility: ${(props) => (props.$active ? "visible" : "hidden")};
    z-index: ${(props) => (props.$active ? 1 : 0)};
`;

function ChatSection() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(() => {
        // Check if there's a scrollTo param that specifies a message (should switch to chat tab)
        const scrollTo = new URLSearchParams(window.location.search).get(
            "scrollTo",
        );
        if (scrollTo?.startsWith("message-")) {
            return "chat";
        }
        // Check if tab param is set
        const tabParam = new URLSearchParams(window.location.search).get("tab");
        if (
            tabParam === "chat" ||
            tabParam === "comments" ||
            tabParam === "achievements"
        ) {
            return tabParam;
        }
        const saved = localStorage.getItem(CHAT_TAB_STORAGE_KEY);
        if (saved === "comments" || saved === "achievements") {
            return saved;
        }
        return "chat";
    });
    const { currentKicker } = useKicker();
    const { user } = useUser();
    const { unreadCount, invalidate: invalidateUnreadCount } =
        useUnreadCommentCount();
    const { invalidateUnreadBadge } = useUnreadBadge(user?.id);
    const { isDesktop, isTablet, isMobile } = useWindowWidth();

    // Handle tab query param changes
    useEffect(() => {
        const tabParam = searchParams.get("tab");
        const scrollTo = searchParams.get("scrollTo");

        // Switch to chat tab if scrollTo is for a message
        if (scrollTo?.startsWith("message-")) {
            setActiveTab("chat");
        } else if (
            tabParam === "chat" ||
            tabParam === "comments" ||
            tabParam === "achievements"
        ) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    // Handle navigation from notification clicks (via location.state)
    // This ensures the chat tab is activated even when already on /home
    useEffect(() => {
        if (location.state?.scrollToMessageId && location.state?.scrollKey) {
            setActiveTab("chat");
        }
    }, [location.state?.scrollToMessageId, location.state?.scrollKey]);

    // Persist tab selection
    useEffect(() => {
        localStorage.setItem(CHAT_TAB_STORAGE_KEY, activeTab);
    }, [activeTab]);

    const handleTabChange = useCallback(
        async (tab) => {
            setActiveTab(tab);

            // Mark comments as read when switching to comments tab
            if (tab === "comments" && currentKicker) {
                try {
                    console.log(
                        "[ChatSection] Marking comments as read for kicker:",
                        currentKicker,
                    );
                    await updateCommentReadStatus(currentKicker);
                    console.log(
                        "[ChatSection] updateCommentReadStatus completed",
                    );
                    invalidateUnreadCount();
                    // Also invalidate global badge to update browser tab title
                    invalidateUnreadBadge();
                } catch (error) {
                    console.error("Error marking comments as read:", error);
                }
            }
        },
        [currentKicker, invalidateUnreadCount, invalidateUnreadBadge],
    );

    // Mark comments as read if comments tab is already active on mount
    // Using a ref to track if we've already run this once
    const hasMarkedCommentsAsReadRef = useRef(false);

    useEffect(() => {
        if (
            activeTab === "comments" &&
            currentKicker &&
            !hasMarkedCommentsAsReadRef.current
        ) {
            hasMarkedCommentsAsReadRef.current = true;
            const timer = setTimeout(async () => {
                try {
                    console.log(
                        "[ChatSection] Initial mark comments as read for kicker:",
                        currentKicker,
                    );
                    await updateCommentReadStatus(currentKicker);
                    invalidateUnreadCount();
                    invalidateUnreadBadge();
                } catch (error) {
                    console.error(
                        "Error marking comments as read on mount:",
                        error,
                    );
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [activeTab, currentKicker]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <StyledChatSection>
            <ChatContainer>
                <TabBar>
                    <TabButton
                        $active={activeTab === "chat"}
                        onClick={() => handleTabChange("chat")}
                    >
                        <HiChatBubbleLeftRight />
                        {isDesktop && "Kicker Chat"}
                        {isTablet && "Kicker Chat"}
                        {isMobile && "Chat"}
                    </TabButton>
                    <TabButton
                        $active={activeTab === "comments"}
                        onClick={() => handleTabChange("comments")}
                    >
                        <HiChatBubbleOvalLeftEllipsis />
                        {isDesktop && "Match Comments"}
                        {isTablet && "Comments"}
                        {isMobile && "Comments"}
                        <CountBadge count={unreadCount} size="sm" />
                    </TabButton>
                    <TabButton
                        $active={activeTab === "achievements"}
                        onClick={() => handleTabChange("achievements")}
                    >
                        <HiOutlineTrophy />
                        {isDesktop && "Achievement Ticker"}
                        {isTablet && "Achievements"}
                        {isMobile && "Achieves"}
                    </TabButton>
                </TabBar>

                <TabContent>
                    <TabPanel $active={activeTab === "chat"}>
                        <ChatTab />
                    </TabPanel>
                    <TabPanel $active={activeTab === "comments"}>
                        <MatchCommentsTab />
                    </TabPanel>
                    <TabPanel $active={activeTab === "achievements"}>
                        <AchievementTickerTab />
                    </TabPanel>

                    {/* {activeTab === "chat" && <ChatTab />}
                    {activeTab === "comments" && <MatchCommentsTab />}
                    {activeTab === "achievements" && <AchievementTickerTab />} */}
                </TabContent>
            </ChatContainer>
        </StyledChatSection>
    );
}

export default ChatSection;
