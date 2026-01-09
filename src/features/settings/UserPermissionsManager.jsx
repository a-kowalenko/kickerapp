import styled from "styled-components";
import { HiUserGroup } from "react-icons/hi2";
import {
    useKickerPermissions,
    useTogglePermission,
    PERMISSION_TYPES,
} from "./useUserPermissions";
import { PERMISSION_METADATA } from "../../services/apiUserPermissions";
import Spinner from "../../ui/Spinner";
import Avatar from "../../ui/Avatar";
import SwitchButton from "../../ui/SwitchButton";
import { media } from "../../utils/constants";

const StyledPermissionsSettings = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
`;

const InfoText = styled.p`
    color: var(--secondary-text-color);
    font-size: 1.4rem;
    line-height: 1.6;
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const SectionTitle = styled.h3`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--primary-text-color);
    display: flex;
    align-items: center;
    gap: 0.8rem;

    & svg {
        color: var(--primary-button-color);
    }
`;

const UsersTable = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    background-color: var(--secondary-background-color);
    border-radius: var(--border-radius-md);
    border: 1px solid var(--primary-border-color);
    padding: 1.6rem;
`;

const TableHeader = styled.div`
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: center;
    padding: 0.8rem 1.2rem;
    background-color: var(--tertiary-background-color);
    border-radius: var(--border-radius-sm);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--secondary-text-color);

    ${media.tablet} {
        display: none;
    }
`;

const UserCard = styled.div`
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    align-items: center;
    padding: 1rem 1.2rem;
    background-color: var(--primary-background-color);
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--primary-border-color);

    ${media.tablet} {
        grid-template-columns: auto 1fr;
        gap: 1rem;
    }
`;

const UserInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
`;

const UserName = styled.span`
    font-weight: 500;
    font-size: 1.4rem;
    color: var(--primary-text-color);
`;

const PermissionsGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;

    ${media.tablet} {
        grid-column: 1 / -1;
        justify-content: flex-end;
    }
`;

const PermissionToggle = styled.div`
    display: flex;
    align-items: center;
    gap: 0.8rem;
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 3rem;
    color: var(--secondary-text-color);
    font-size: 1.4rem;
`;

function UserPermissionsManager() {
    const { users, isLoading } = useKickerPermissions();
    const { toggle, isToggling } = useTogglePermission();

    if (isLoading) {
        return <Spinner />;
    }

    const handleToggle = (userId, permissionType, currentValue) => {
        toggle({ userId, permissionType, currentValue });
    };

    // Get list of all permission types to display
    const permissionTypes = Object.values(PERMISSION_TYPES);

    return (
        <StyledPermissionsSettings>
            <InfoText>
                Manage user permissions for your kicker. Enable or disable
                specific features for each user. Only kicker admins can modify
                these settings.
            </InfoText>

            <Section>
                <SectionTitle>
                    <HiUserGroup />
                    User Permissions
                </SectionTitle>

                <UsersTable>
                    <TableHeader>
                        <span></span>
                        <span>User</span>
                        <span>Permissions</span>
                    </TableHeader>

                    {users.length === 0 ? (
                        <EmptyState>No users found in this kicker</EmptyState>
                    ) : (
                        users.map((user) => (
                            <UserCard key={user.userId}>
                                <UserInfo>
                                    <Avatar
                                        player={{
                                            id: user.playerId,
                                            avatar: user.playerAvatar,
                                        }}
                                        $size="small"
                                    />
                                    <UserName>{user.playerName}</UserName>
                                </UserInfo>

                                <PermissionsGroup>
                                    {permissionTypes.map((permType) => {
                                        const metadata =
                                            PERMISSION_METADATA[permType] || {};
                                        const hasPermission =
                                            user.permissions[permType]
                                                ?.granted || false;

                                        return (
                                            <PermissionToggle key={permType}>
                                                <SwitchButton
                                                    label={
                                                        metadata.label ||
                                                        permType
                                                    }
                                                    value={hasPermission}
                                                    onChange={() =>
                                                        handleToggle(
                                                            user.userId,
                                                            permType,
                                                            hasPermission
                                                        )
                                                    }
                                                    disabled={isToggling}
                                                />
                                            </PermissionToggle>
                                        );
                                    })}
                                </PermissionsGroup>
                            </UserCard>
                        ))
                    )}
                </UsersTable>
            </Section>
        </StyledPermissionsSettings>
    );
}

export default UserPermissionsManager;
