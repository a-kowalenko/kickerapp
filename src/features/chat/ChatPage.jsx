import styled from "styled-components";
import { useState, useEffect, useCallback } from "react";
import {
    HiChatBubbleLeftRight,
    HiChatBubbleOvalLeftEllipsis,
} from "react-icons/hi2";
import ChatTab from "../home/ChatTab";
import MatchCommentsTab from "../home/MatchCommentsTab";
import { useKicker } from "../../contexts/KickerContext";
import { useUser } from "../authentication/useUser";
import { useUnreadCommentCount } from "../home/useUnreadCommentCount";
import useUnreadBadge from "../../hooks/useUnreadBadge";
import { updateCommentReadStatus } from "../../services/apiComments";

const DESKTOP_CHAT_TAB_KEY = "zerohero-desktop-chat-tab";

const StyledChatPage = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-lg);
    border: none;
    /* Offset parent padding for full-height layout */
    margin: -1rem -4.8rem 0;
    padding: 0;
    height: calc(100% + 3.2rem);
`;

const TabBar = styled.div`
    display: flex;
    /* background-color: var(--tertiary-background-color); */
    flex-shrink: 0;
    border-bottom: 1px solid var(--primary-border-color);
`;

const TabButton = styled.button`
    flex: 1;
    max-width: 20rem;
    padding: 1.2rem 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    border: none;
    border-bottom: ${(props) =>
        props.$active
            ? "3px solid var(--color-brand-500)"
            : "3px solid transparent"};
    background-color: transparent;
    color: ${(props) =>
        props.$active
            ? "var(--color-brand-500)"
            : "var(--secondary-text-color)"};
    font-size: 1.5rem;
    font-weight: ${(props) => (props.$active ? "600" : "500")};
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not([disabled]) {
        color: var(--color-brand-500);
        background-color: var(--quaternary-background-color);
    }

    & svg {
        font-size: 2rem;
        transition: color 0.2s;
    }
`;

const UnreadBadge = styled.span`
    background-color: var(--color-red-700);
    color: white;
    padding: 0.1rem 0.5rem;
    border-radius: var(--border-radius-pill);
    font-size: 1.1rem;
    font-weight: 600;
    min-width: 1.8rem;
    text-align: center;
`;

const ChatContent = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background-color: var(--secondary-background-color);
`;

const TabPanel = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
`;

function ChatPage() {
    const [activeTab, setActiveTab] = useState(() => {
        const saved = localStorage.getItem(DESKTOP_CHAT_TAB_KEY);
        return saved === "comments" ? "comments" : "chat";
    });

    const { currentKicker } = useKicker();
    const { user } = useUser();
    const { unreadCount, invalidate: invalidateUnreadCount } =
        useUnreadCommentCount();
    const { invalidateUnreadBadge } = useUnreadBadge(user?.id);

    // Persist tab selection
    useEffect(() => {
        localStorage.setItem(DESKTOP_CHAT_TAB_KEY, activeTab);
    }, [activeTab]);

    const handleTabChange = useCallback(
        async (tab) => {
            setActiveTab(tab);

            // Mark comments as read when switching to comments tab
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
        [currentKicker, invalidateUnreadCount, invalidateUnreadBadge]
    );

    return (
        <StyledChatPage>
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
                    {unreadCount > 0 && (
                        <UnreadBadge>{unreadCount}</UnreadBadge>
                    )}
                </TabButton>
            </TabBar>
            <ChatContent>
                {activeTab === "chat" && (
                    <TabPanel>
                        <ChatTab />
                    </TabPanel>
                )}
                {activeTab === "comments" && (
                    <TabPanel>
                        <MatchCommentsTab />
                    </TabPanel>
                )}
            </ChatContent>
        </StyledChatPage>
    );
}

export default ChatPage;
