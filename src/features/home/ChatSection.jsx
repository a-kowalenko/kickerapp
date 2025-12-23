import styled from "styled-components";
import { useState, useCallback, useEffect } from "react";
import {
    HiChatBubbleLeftRight,
    HiChatBubbleOvalLeftEllipsis,
} from "react-icons/hi2";
import { useKicker } from "../../contexts/KickerContext";
import { useUnreadCommentCount } from "./useUnreadCommentCount";
import { updateCommentReadStatus } from "../../services/apiComments";
import ChatTab from "./ChatTab";
import MatchCommentsTab from "./MatchCommentsTab";
import { media } from "../../utils/constants";
import ContentBox from "../../ui/ContentBox";

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

const TabContent = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--primary-border-color);
    border-top: none;
    border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
`;

function ChatSection() {
    const [activeTab, setActiveTab] = useState(() => {
        const saved = localStorage.getItem(CHAT_TAB_STORAGE_KEY);
        return saved === "comments" ? "comments" : "chat";
    });
    const { currentKicker } = useKicker();
    const { unreadCount, invalidate: invalidateUnreadCount } =
        useUnreadCommentCount();

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
                    await updateCommentReadStatus(currentKicker);
                    invalidateUnreadCount();
                } catch (error) {
                    console.error("Error marking comments as read:", error);
                }
            }
        },
        [currentKicker, invalidateUnreadCount]
    );

    return (
        <StyledChatSection>
            <ChatContainer>
                <TabBar>
                    <TabButton
                        $active={activeTab === "chat"}
                        onClick={() => handleTabChange("chat")}
                    >
                        <HiChatBubbleLeftRight />
                        Kicker Chat
                    </TabButton>
                    <TabButton
                        $active={activeTab === "comments"}
                        onClick={() => handleTabChange("comments")}
                    >
                        <HiChatBubbleOvalLeftEllipsis />
                        Match Comments
                        {unreadCount > 0 && (
                            <UnreadBadge>{unreadCount}</UnreadBadge>
                        )}
                    </TabButton>
                </TabBar>

                <TabContent>
                    {activeTab === "chat" && <ChatTab />}
                    {activeTab === "comments" && <MatchCommentsTab />}
                </TabContent>
            </ChatContainer>
        </StyledChatSection>
    );
}

export default ChatSection;
