import styled, { css } from "styled-components";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    HiChatBubbleLeftRight,
    HiChatBubbleOvalLeftEllipsis,
} from "react-icons/hi2";
import ChatTab from "../home/ChatTab";
import MatchCommentsTab from "../home/MatchCommentsTab";
import { media } from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";
import { useUser } from "../authentication/useUser";
import { useUnreadCommentCount } from "../home/useUnreadCommentCount";
import useUnreadBadge from "../../hooks/useUnreadBadge";
import { updateCommentReadStatus } from "../../services/apiComments";
import { useKeyboard } from "../../contexts/KeyboardContext";

const MOBILE_CHAT_TAB_KEY = "zerohero-mobile-chat-tab";

const NAVBAR_HEIGHT = "6rem";

const StyledChatPage = styled.div`
    display: flex;
    flex-direction: column;
    height: calc(100dvh - 66px - ${NAVBAR_HEIGHT});
    margin-bottom: ${NAVBAR_HEIGHT};

    ${media.tablet} {
        /* Fallback for older iOS without dvh support */
        height: calc(100vh - 66px - ${NAVBAR_HEIGHT});
        margin: 0;
        overflow: hidden;
        flex: 1;
        transition: height 0.2s ease-out;

        /* When keyboard is open, navbar is hidden - use full height */
        ${(props) =>
            props.$keyboardOpen &&
            css`
                height: calc(100vh - 66px);
            `}
    }

    /* Modern browsers with dvh support */
    @supports (height: 100dvh) {
        ${media.tablet} {
            height: calc(100dvh - 66px - ${NAVBAR_HEIGHT});

            ${(props) =>
                props.$keyboardOpen &&
                css`
                    height: calc(100dvh - 66px);
                `}
        }
    }

    /* iOS Safari safe area support */
    @supports (padding-bottom: env(safe-area-inset-bottom)) {
        ${media.tablet} {
            padding-bottom: ${(props) =>
                props.$keyboardOpen ? "0" : "env(safe-area-inset-bottom, 0px)"};
        }
    }
`;

const TabBar = styled.div`
    display: flex;
    background-color: var(--tertiary-background-color);
    flex-shrink: 0;
`;

const TabButton = styled.button`
    flex: 1;
    padding: 1rem 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    border: none;
    border-bottom: ${(props) =>
        props.$active
            ? "2px solid var(--color-brand-500)"
            : "2px solid transparent"};
    background-color: transparent;
    color: ${(props) =>
        props.$active
            ? "var(--color-brand-500)"
            : "var(--secondary-text-color)"};
    font-size: 1.4rem;
    font-weight: ${(props) => (props.$active ? "600" : "500")};
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not([disabled]) {
        color: var(--color-brand-500);
    }

    & svg {
        font-size: 1.8rem;
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
    /* Force GPU layer for iOS Safari */
    transform: translateZ(0);
    backface-visibility: hidden;
`;

const TabPanel = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    /* Force GPU layer for iOS Safari */
    transform: translateZ(0);
`;

function ChatPage() {
    const [activeTab, setActiveTab] = useState(() => {
        const saved = localStorage.getItem(MOBILE_CHAT_TAB_KEY);
        return saved === "comments" ? "comments" : "chat";
    });

    const contentRef = useRef(null);
    const { currentKicker } = useKicker();
    const { user } = useUser();
    const { unreadCount, invalidate: invalidateUnreadCount } =
        useUnreadCommentCount();
    const { invalidateUnreadBadge } = useUnreadBadge(user?.id);
    const { isKeyboardOpen, blurInput } = useKeyboard();

    // Force repaint on mount to fix iOS Safari rendering issues
    useEffect(() => {
        const container = contentRef.current;
        if (!container) return;

        // Force reflow/repaint
        const forceRepaint = () => {
            if (!container) return;
            // eslint-disable-next-line no-unused-expressions
            container.offsetHeight;
        };

        forceRepaint();

        const raf = requestAnimationFrame(() => {
            forceRepaint();
            requestAnimationFrame(forceRepaint);
        });

        return () => cancelAnimationFrame(raf);
    }, [activeTab]); // Also run when tab changes

    // Persist tab selection
    useEffect(() => {
        localStorage.setItem(MOBILE_CHAT_TAB_KEY, activeTab);
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

    // Handle click on messages area to blur input (close keyboard)
    // Use onMouseDown to check BEFORE the click reaches the input
    const handleContentMouseDown = useCallback(
        (e) => {
            // Check if clicking on interactive elements - if so, don't blur
            const clickedOnInput = e.target.closest("[contenteditable]");
            const clickedOnButton = e.target.closest("button");
            const clickedOnLink = e.target.closest("a");
            // Also check for the input container area
            const clickedOnInputContainer = e.target.closest(
                '[data-chat-input="true"]'
            );

            // If clicking on input area or any interactive element, don't interfere
            if (
                clickedOnInput ||
                clickedOnButton ||
                clickedOnLink ||
                clickedOnInputContainer
            ) {
                return;
            }

            // If keyboard is open and clicking elsewhere, blur
            if (isKeyboardOpen) {
                blurInput();
            }
        },
        [isKeyboardOpen, blurInput]
    );

    return (
        <StyledChatPage $keyboardOpen={isKeyboardOpen}>
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
            <ChatContent ref={contentRef} onMouseDown={handleContentMouseDown}>
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
