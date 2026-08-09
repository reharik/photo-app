import { AlbumMemberRole, Operation } from '@packages/contracts';
import { X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import type { AppError } from '../../../domain/errors/errorTypes';
import type { AlbumMembersQuery, ShareContactType } from '../../../graphql/generated/types';
import { AppErrorPanel } from '../../../ui/AppErrorPanel';
import { MultiCombobox, type MultiComboboxOption } from '../../../ui/MultiCombobox';
import { Button, VStack } from '../../../ui/Primitives';
import { PublicLinkField } from './PublicLinkField';
import { RoleMenu, type RoleMenuItem } from './RoleMenu';
import { EMAIL_SEPARATORS } from './shareAlbumTypes';

export type AlbumMemberVM = NonNullable<
  NonNullable<AlbumMembersQuery['viewer']>['album']
>['albumMembers']['nodes'][number];

type ManagePanelProps = {
  members: AlbumMemberVM[];
  membersLoading: boolean;
  emailShares: string[];
  publicLinkToken: string | undefined;
  suggestions: ShareContactType[];
  albumOperations: Operation[];
  errors: AppError[];
  /** id of the member (or email of the share) with a mutation in flight. */
  busyKey: string | undefined;
  onStartCompose: (emails: string[]) => void;
  onChangeMemberRole: (albumMemberId: string, role: 'CONTRIBUTOR' | 'ADMIN') => void;
  onRemoveMember: (albumMemberId: string) => void;
  onRevokeEmailShare: (email: string) => void;
  onRequestResetLink: () => void;
  onDeleteContact: (handle: string) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (input: string): string => input.trim().toLowerCase();

const validateEmail = (input: string): string | undefined => {
  const trimmed = input.trim();
  if (!trimmed) {
    return 'Enter an email address';
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Enter a valid email address';
  }
  return undefined;
};

const ROLE_ORDER: Record<string, number> = { OWNER: 0, ADMIN: 1, CONTRIBUTOR: 2 };

/**
 * MANAGE mode: everything commits inline — no footer. One list of people
 * (owner, members with a role dropdown, email shares with a revoke ×), then the
 * persistent public link.
 */
export const ManagePanel = ({
  members,
  membersLoading,
  emailShares,
  publicLinkToken,
  suggestions,
  albumOperations,
  errors,
  busyKey,
  onStartCompose,
  onChangeMemberRole,
  onRemoveMember,
  onRevokeEmailShare,
  onRequestResetLink,
  onDeleteContact,
}: ManagePanelProps) => {
  // The input never keeps a selection: any committed entry (Enter, blur,
  // The input is a real multiselect: committed entries (Enter, blur, separator,
  // suggestion pick, paste) collect as pills, and "Add people" moves the whole
  // batch to COMPOSE at once — so the recipients resolve in a single query.
  const [inputSelection, setInputSelection] = useState<MultiComboboxOption[]>([]);

  const suggestionOptions = useMemo(
    () =>
      suggestions.map((contact) => ({
        value: normalizeEmail(contact.handle),
        display: normalizeEmail(contact.handle),
      })),
    [suggestions],
  );

  const handleStartCompose = useCallback(() => {
    if (inputSelection.length === 0) {
      return;
    }
    onStartCompose(inputSelection.map((option) => option.value));
    setInputSelection([]);
  }, [inputSelection, onStartCompose]);

  const createRecipientItem = useCallback((input: string): MultiComboboxOption => {
    const normalized = normalizeEmail(input);
    return { value: normalized, display: normalized };
  }, []);

  const canManageMembers = albumOperations.includes(Operation.removeMembers);

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        const roleDiff = (ROLE_ORDER[a.role.value] ?? 9) - (ROLE_ORDER[b.role.value] ?? 9);
        if (roleDiff !== 0) {
          return roleDiff;
        }
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }),
    [members],
  );

  const memberRoleItems = (member: AlbumMemberVM): RoleMenuItem[] => [
    {
      key: 'CONTRIBUTOR',
      label: AlbumMemberRole.contributor.display,
      selected: member.role.equals(AlbumMemberRole.contributor),
    },
    {
      key: 'ADMIN',
      label: AlbumMemberRole.admin.display,
      selected: member.role.equals(AlbumMemberRole.admin),
    },
    { key: 'REMOVE', label: 'Remove', danger: true, dividerBefore: true },
  ];

  return (
    <VStack gap={3}>
      <AppErrorPanel errors={errors} />
      <AddPeopleBlock>
        <ComboboxWrap>
          <MultiCombobox
            value={inputSelection}
            onChange={setInputSelection}
            items={suggestionOptions}
            allowCustomValue
            validateEntry={validateEmail}
            createCustomItem={createRecipientItem}
            separators={EMAIL_SEPARATORS}
            placeholder="Add people by email"
            onDeleteItem={onDeleteContact}
            deleteItemLabel="Remove from saved contacts"
          />
        </ComboboxWrap>
        {inputSelection.length > 0 ? (
          <Button type="button" variant="primary" size="small" onClick={handleStartCompose}>
            Add people
          </Button>
        ) : null}
      </AddPeopleBlock>

      <Section>
        <SectionLabel>People with access</SectionLabel>
        {membersLoading && members.length === 0 ? (
          <MutedRow>Loading people…</MutedRow>
        ) : (
          <RowList>
            {sortedMembers.map((member) => {
              const isOwner = member.role.equals(AlbumMemberRole.owner);
              return (
                <PersonRow key={member.id}>
                  <PersonText>
                    <PersonName>
                      {member.firstName} {member.lastName}
                    </PersonName>
                    {/*
                      SDL GAP (flagged in the 1b report): AlbumMember exposes no
                      email field yet. The design shows the member's email as a
                      subline here — add it to this row once the field lands.
                    */}
                  </PersonText>
                  <PersonAction>
                    {isOwner || !canManageMembers ? (
                      <StaticRole>{member.role.display}</StaticRole>
                    ) : (
                      <RoleMenu
                        triggerLabel={member.role.display}
                        items={memberRoleItems(member)}
                        disabled={busyKey === member.id}
                        aria-label={`Change role for ${member.firstName} ${member.lastName}`}
                        onSelect={(key) => {
                          if (key === 'REMOVE') {
                            onRemoveMember(member.id);
                          } else {
                            onChangeMemberRole(member.id, key as 'CONTRIBUTOR' | 'ADMIN');
                          }
                        }}
                      />
                    )}
                  </PersonAction>
                </PersonRow>
              );
            })}
            {emailShares.map((email) => (
              <PersonRow key={email}>
                <PersonText>
                  <PersonName>{email}</PersonName>
                  <PersonSub>No account yet · can view</PersonSub>
                </PersonText>
                <PersonAction>
                  <RevokeButton
                    type="button"
                    aria-label={`Revoke access for ${email}`}
                    title="Revoke access"
                    disabled={busyKey === email}
                    onClick={() => onRevokeEmailShare(email)}
                  >
                    <X size={16} strokeWidth={2} aria-hidden />
                  </RevokeButton>
                </PersonAction>
              </PersonRow>
            ))}
          </RowList>
        )}
      </Section>

      <PublicLinkField token={publicLinkToken} onRequestReset={onRequestResetLink} />
    </VStack>
  );
};

const AddPeopleBlock = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const ComboboxWrap = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const SectionLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.bodyText};
`;

const RowList = styled.div`
  display: flex;
  flex-direction: column;
`;

const PersonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(1)} 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color.border};
  }
`;

const PersonText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.25)};
  min-width: 0;
`;

const PersonName = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.bodyText};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PersonSub = styled.span`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const PersonAction = styled.div`
  flex-shrink: 0;
`;

const StaticRole = styled.span`
  font-size: ${({ theme }) => theme.fontSize._13};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
`;

const RevokeButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.spacing(3.5)};
  height: ${({ theme }) => theme.spacing(3.5)};
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.color.bodyTextMuted};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.bodyElevated};
    color: ${({ theme }) => theme.color.formError};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.inputBorderFocus};
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const MutedRow = styled.div`
  padding: ${({ theme }) => theme.spacing(1)} 0;
  font-size: ${({ theme }) => theme.fontSize._13};
  color: ${({ theme }) => theme.color.bodyTextMuted};
`;
