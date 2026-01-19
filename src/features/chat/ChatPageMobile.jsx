import styled from "styled-components";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
    HiChatBubbleLeftRight,
    HiChatBubbleOvalLeftEllipsis,
    HiUsers,
} from "react-icons/hi2";
import MessageListMobile from "./MessageListMobile";
import MatchCommentsTab from "../home/MatchCommentsTab";
import PlayerActivityListMobile from "../activity/PlayerActivityListMobile";
import { useKicker } from "../../contexts/KickerContext";
import { useUser } from "../authentication/useUser";
import { useUnreadCommentCount } from "../home/useUnreadCommentCount";
import useUnreadBadge from "../../hooks/useUnreadBadge";
import { updateCommentReadStatus } from "../../services/apiComments";
import { useKeyboard } from "../../contexts/KeyboardContext";
import CountBadge from "../../ui/CountBadge";

const MOBILE_CHAT_TAB_KEY = "zerohero-mobile-chat-tab";

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background-color: var(--secondary-background-color);
`;

const TabBar = styled.div`
    display: flex;
    background-color: var(--tertiary-background-color);
    flex-shrink: 0;
    border-bottom: 1px solid var(--primary-border-color);
`;

const TabButton = styled.button`
    flex: 1;
    padding: 1rem 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    border: none;
    border-bottom: 2px solid
        ${(props) => (props.$active ? "var(--color-brand-500)" : "transparent")};
    background-color: transparent;
    color: ${(props) =>
        props.$active
            ? "var(--color-brand-500)"
            : "var(--secondary-text-color)"};
    font-size: 1.4rem;
    font-weight: ${(props) => (props.$active ? "600" : "500")};
    cursor: pointer;
    transition:
        color 0.2s,
        border-color 0.2s;

    &:active {
        background-color: var(--quaternary-background-color);
    }

    & svg {
        font-size: 1.8rem;
    }
`;

const TabContent = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
`;

function ChatPageMobile() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Determine initial tab from URL or localStorage
    const [activeTab, setActiveTab] = useState(() => {
        const urlTab = searchParams.get("tab");
        if (urlTab === "chat" || urlTab === "comments" || urlTab === "activity") return urlTab;
        const saved = localStorage.getItem(MOBILE_CHAT_TAB_KEY);
        if (saved === "comments" || saved === "activity") return saved;
        return "chat";
    });

    // Deep link message ID from URL
    const scrollToMessageId = useMemo(() => {
        const scrollTo = searchParams.get("scrollTo");
        if (scrollTo?.startsWith("message-")) {
            return scrollTo.replace("message-", "");
        }
        return null;
    }, [searchParams]);

    const scrollTimestamp = searchParams.get("_t");

    const { currentKicker } = useKicker();
    const { user } = useUser();
    const { unreadCount, invalidate: invalidateUnreadCount } =
        useUnreadCommentCount();
    const { invalidateUnreadBadge } = useUnreadBadge(user?.id);
    const { blurInput } = useKeyboard();

    // Switch to chat tab if scrollTo param is present
    useEffect(() => {
        if (scrollToMessageId && activeTab !== "chat") {
            setActiveTab("chat");
        }
    }, [scrollToMessageId, activeTab]);

    // Persist tab selection
    useEffect(() => {
        localStorage.setItem(MOBILE_CHAT_TAB_KEY, activeTab);
    }, [activeTab]);

    const handleTabChange = useCallback(
        async (tab) => {
            blurInput();
            setActiveTab(tab);

            if (tab === "comments" && currentKicker) {
                try {
                    await updateCommentReadStatus(currentKicker);
                    invalidateUnreadCount();
                    invalidateUnreadBadge();
                } catch (error) {
                    console.error("Error marking comments as read:", error);
                }
            }
        },
        [
            currentKicker,
            invalidateUnreadCount,
            invalidateUnreadBadge,
            blurInput,
        ],
    );

    const handleScrollComplete = useCallback(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("scrollTo");
        newParams.delete("_t");
        if (newParams.toString() !== searchParams.toString()) {
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    return (
        <PageContainer>
            <TabBar>
                <TabButton
                    $active={activeTab === "chat"}
                    onClick={() => handleTabChange("chat")}
                >
                    <HiChatBubbleLeftRight />
                    Chat
                </TabButton>
                <TabButton
                    $active={activeTab === "comments"}
                    onClick={() => handleTabChange("comments")}
                >
                    <HiChatBubbleOvalLeftEllipsis />
                    Comments
                    <CountBadge count={unreadCount} size="sm" />
                </TabButton>
                <TabButton
                    $active={activeTab === "activity"}
                    onClick={() => handleTabChange("activity")}
                >
                    <HiUsers />
                    Activity
                </TabButton>
            </TabBar>

            <TabContent>
                {activeTab === "chat" && (
                    <MessageListMobile
                        scrollToMessageId={scrollToMessageId}
                        scrollTimestamp={scrollTimestamp}
                        onScrollComplete={handleScrollComplete}
                    />
                )}
                {activeTab === "comments" && <MatchCommentsTab />}
                {activeTab === "activity" && <PlayerActivityListMobile />}
            </TabContent>
        </PageContainer>
    );
}

export default ChatPageMobile;
