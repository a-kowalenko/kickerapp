import styled from "styled-components";
import { useRef, useCallback } from "react";
import { HiOutlineBell, HiArrowLeft } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../features/notifications/useNotifications";
import NotificationItem from "../features/notifications/NotificationItem";
import SpinnerMini from "../ui/SpinnerMini";
import ButtonIcon from "../ui/ButtonIcon";

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--primary-background-color);
`;

const PageHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.6rem 2rem;
    border-bottom: 1px solid var(--primary-border-color);
    background-color: var(--secondary-background-color);
`;

const BackButton = styled(ButtonIcon)`
    & svg {
        width: 2.4rem;
        height: 2.4rem;
    }
`;

const HeaderTitle = styled.h1`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;
    flex: 1;
`;

const MarkAllReadButton = styled.button`
    background: none;
    border: none;
    color: var(--primary-button-color);
    font-size: 1.4rem;
    cursor: pointer;
    padding: 0.6rem 1rem;
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
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6rem 2rem;
    text-align: center;
    color: var(--tertiary-text-color);

    & svg {
        width: 5rem;
        height: 5rem;
        margin-bottom: 1.5rem;
        opacity: 0.5;
    }

    & p {
        font-size: 1.5rem;
    }
`;

const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4rem;
`;

const LoadMoreTrigger = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    color: var(--tertiary-text-color);
    font-size: 1.3rem;
`;

function Notifications() {
    const navigate = useNavigate();
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

    const handleScroll = useCallback(
        (e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            if (
                scrollHeight - scrollTop - clientHeight < 100 &&
                hasNextPage &&
                !isFetchingNextPage
            ) {
                fetchNextPage();
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    );

    function handleBack() {
        navigate(-1);
    }

    function handleMarkAllAsRead() {
        markAllAsRead();
    }

    return (
        <PageContainer>
            <PageHeader>
                <BackButton onClick={handleBack} title="Zurück">
                    <HiArrowLeft />
                </BackButton>
                <HeaderTitle>Notifications</HeaderTitle>
                {unreadCount > 0 && (
                    <MarkAllReadButton
                        onClick={handleMarkAllAsRead}
                        disabled={isMarkingAllAsRead}
                    >
                        {isMarkingAllAsRead ? <SpinnerMini /> : "Alle gelesen"}
                    </MarkAllReadButton>
                )}
            </PageHeader>

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
        </PageContainer>
    );
}

export default Notifications;
