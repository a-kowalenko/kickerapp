import styled from "styled-components";
import { useRef, useCallback } from "react";
import { HiOutlineBell } from "react-icons/hi2";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { useNotifications } from "./useNotifications";
import NotificationItem from "./NotificationItem";
import ButtonIcon from "../../ui/ButtonIcon";
import SpinnerMini from "../../ui/SpinnerMini";
import { useState } from "react";

const NotificationWrapper = styled.div`
    position: relative;
`;

const BellButton = styled(ButtonIcon)`
    position: relative;
`;

const NotificationBadge = styled.span`
    position: absolute;
    top: -0.2rem;
    right: -0.2rem;
    min-width: 1.8rem;
    height: 1.8rem;
    padding: 0 0.5rem;
    background-color: var(--color-red-700);
    color: white;
    font-size: 1rem;
    font-weight: 600;
    border-radius: var(--border-radius-pill);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
`;

const Dropdown = styled.div`
    position: absolute;
    top: calc(100% + 1rem);
    right: 0;
    width: 38rem;
    max-width: calc(100vw - 2rem);
    background-color: var(--color-grey-0);
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;

const DropdownHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.2rem 1.4rem;
    border-bottom: 1px solid var(--primary-border-color);
    background-color: var(--secondary-background-color);
`;

const HeaderTitle = styled.h3`
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;
`;

const MarkAllReadButton = styled.button`
    background: none;
    border: none;
    color: var(--primary-button-color);
    font-size: 1.3rem;
    cursor: pointer;
    padding: 0.4rem 0.8rem;
    border-radius: var(--border-radius-sm);
    transition: background-color 0.15s ease;

    &:hover {
        background-color: var(--primary-button-color-hover);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const NotificationList = styled.div`
    max-height: 45rem;
    overflow-y: auto;
    overscroll-behavior: contain;

    /* Discord-style scrollbar */
    &::-webkit-scrollbar {
        width: 0.8rem;
    }

    &::-webkit-scrollbar-track {
        background: var(--secondary-background-color);
    }

    &::-webkit-scrollbar-thumb {
        background: var(--tertiary-text-color);
        border-radius: var(--border-radius-pill);
    }

    &::-webkit-scrollbar-thumb:hover {
        background: var(--secondary-text-color);
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    color: var(--tertiary-text-color);

    & svg {
        width: 4rem;
        height: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    & p {
        font-size: 1.4rem;
    }
`;

const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
`;

const LoadMoreTrigger = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    color: var(--tertiary-text-color);
    font-size: 1.3rem;
`;

function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const listRef = useRef(null);

    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        markAsRead,
        markAllAsRead,
        isMarkingAllAsRead,
    } = useNotifications();

    const close = useCallback(() => setIsOpen(false), []);
    const dropdownRef = useOutsideClick(close);

    function handleToggle() {
        setIsOpen((prev) => !prev);
    }

    function handleMarkAllAsRead() {
        markAllAsRead();
    }

    function handleScroll(e) {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Load more when scrolled to bottom (with 100px threshold)
        if (
            scrollHeight - scrollTop - clientHeight < 100 &&
            hasNextPage &&
            !isFetchingNextPage
        ) {
            fetchNextPage();
        }
    }

    // Format badge count (max 99+)
    const badgeCount = unreadCount > 99 ? "99+" : unreadCount;

    return (
        <NotificationWrapper ref={dropdownRef}>
            <BellButton onClick={handleToggle} title="Notifications">
                <HiOutlineBell />
                {unreadCount > 0 && (
                    <NotificationBadge>{badgeCount}</NotificationBadge>
                )}
            </BellButton>

            {isOpen && (
                <Dropdown>
                    <DropdownHeader>
                        <HeaderTitle>Notifications</HeaderTitle>
                        {unreadCount > 0 && (
                            <MarkAllReadButton
                                onClick={handleMarkAllAsRead}
                                disabled={isMarkingAllAsRead}
                            >
                                {isMarkingAllAsRead ? (
                                    <SpinnerMini />
                                ) : (
                                    "Mark all as read"
                                )}
                            </MarkAllReadButton>
                        )}
                    </DropdownHeader>

                    <NotificationList ref={listRef} onScroll={handleScroll}>
                        {isLoading ? (
                            <LoadingContainer>
                                <SpinnerMini />
                            </LoadingContainer>
                        ) : notifications.length === 0 ? (
                            <EmptyState>
                                <HiOutlineBell />
                                <p>No notifications</p>
                            </EmptyState>
                        ) : (
                            <>
                                {notifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={markAsRead}
                                    />
                                ))}
                                {isFetchingNextPage && (
                                    <LoadMoreTrigger>
                                        <SpinnerMini />
                                    </LoadMoreTrigger>
                                )}
                                {!hasNextPage && notifications.length > 0 && (
                                    <LoadMoreTrigger>
                                        No more notifications
                                    </LoadMoreTrigger>
                                )}
                            </>
                        )}
                    </NotificationList>
                </Dropdown>
            )}
        </NotificationWrapper>
    );
}

export default NotificationBell;
