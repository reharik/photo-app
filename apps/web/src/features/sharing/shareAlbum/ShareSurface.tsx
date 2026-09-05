import { AlbumMemberRole, EmailDeliveryState, Operation } from '@packages/contracts';
import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import type { AppError } from '../../../domain/errors/errorTypes';
import type { AlbumMembersQuery, ShareContactType } from '../../../graphql/generated/types';
import { AppErrorPanel } from '../../../ui/AppErrorPanel';
import { formatActivityTime } from '../../../ui/dateDisplay';
import { MultiCombobox } from '../../../ui/MultiCombobox';
import { Button } from '../../../ui/Primitives';
import { RoleMenu, type RoleMenuItem } from './RoleMenu';
import { EMAIL_SEPARATORS, type SharedWithRowVM } from './shareAlbumTypes';

export type AlbumMemberVM = NonNullable<
  NonNullable<AlbumMembersQuery['viewer']>['album']
>['albumMembers']['nodes'][number];

type ShareSurfaceProps = {
  members: AlbumMemberVM[];
  membersLoading: boolean;
  sharedWith: SharedWithRowVM[];
  /** Failed rows are excluded by the container — this is the header count. */
  sharedWithCount: number;
  /** Drives the shared-with region between loading, S4 empty, and degraded. */
  sharedWithStatus: 'loading' | 'ready' | 'degraded';
  suggestions: ShareContactType[];
  albumOperations: Operation[];
  errors: AppError[];
  /** id of the member (or email of the share) with a mutation in flight. */
  busyKey: string | undefined;
  onAddEmails: (emails: string[]) => void;
  onChangeMemberRole: (albumMemberId: string, role: 'CONTRIBUTOR' | 'ADMIN') => void;
  onRemoveMember: (albumMemberId: string) => void;
  onPromote: (email: string, userId: string, role: 'CONTRIBUTOR' | 'ADMIN') => void;
  onRemoveAccess: (email: string) => void;
  /** Re-run the share for a failed row (only offered when error.retryable). */
  onRetry: (email: string) => void;
  onDismissFailed: (email: string) => void;
  onDeleteContact: (handle: string) => void;
};

/**
 * Did the invite email actually arrive? Three states, three treatments:
 *
 *  delivered — quiet. A check and the word Delivered, timestamp on hover.
 *              NEVER "Read" or "Seen": SES reports only that the receiving
 *              server accepted the message. It may be sitting in spam.
 *  failed    — loud. This is the whole reason the indicator exists: the share
 *              that silently went nowhere. The row's × (Remove access) is the
 *              offered next step; there is no resend.
 *  pending   — nothing at all. It resolves in seconds, and a spinner that
 *              lingers because SES never sent an event reads as broken.
 */
const DeliveryNote = ({ delivery }: { delivery: SharedWithRowVM['delivery'] }) => {
  if (!delivery) {
    return null;
  }
  if (delivery.state.equals(EmailDeliveryState.failed)) {
    return <PersonError role="alert">Couldn&apos;t deliver — check the address.</PersonError>;
  }
  if (delivery.state.equals(EmailDeliveryState.delivered)) {
    return (
      <DeliveredNote title={`Delivered ${formatActivityTime(delivery.at)}`}>
        <Check size={12} strokeWidth={2.5} aria-hidden /> Delivered
      </DeliveredNote>
    );
  }
  return null;
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
 * The single share surface — no modes. Email input on top (the row is the
 * token: committed emails become rows, never pills), then the two groups the
 * data model actually has: MEMBERS (album_member rows, role-bearing) and
 * SHARED WITH (access_grant rows, view-only). Every control commits
 * immediately; there is no footer.
 *
 * Every row's right side is uniform: a role control, then an ×. Removal is
 * ALWAYS the × — never a dropdown option, never buried in a menu.
 */
export const ShareSurface = ({
  members,
  membersLoading,
  sharedWith,
  sharedWithCount,
  sharedWithStatus,
  suggestions,
  albumOperations,
  errors,
  busyKey,
  onAddEmails,
  onChangeMemberRole,
  onRemoveMember,
  onPromote,
  onRemoveAccess,
  onRetry,
  onDismissFailed,
  onDeleteContact,
}: ShareSurfaceProps) => {
  const canManageMembers = albumOperations.includes(Operation.removeMembers);
  const canPromote = albumOperations.includes(Operation.addMembers);

  /**
   * Scroll affordance for the roster region: with the input and public link
   * fixed, a fade at the clipped edge is the only cue that rows continue.
   * atEnd is true when the region doesn't scroll at all, so a short (or
   * empty) roster renders no fades.
   */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const updateScrollEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    setAtStart(el.scrollTop <= 0);
    setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.addEventListener('scroll', updateScrollEdges, { passive: true });
    const observer = new ResizeObserver(updateScrollEdges);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollEdges);
      observer.disconnect();
    };
  }, [updateScrollEdges]);

  // Row changes alter scrollHeight without resizing the container (which is
  // all the ResizeObserver sees) — re-check the edges after every render.
  useEffect(() => {
    updateScrollEdges();
  });

  const suggestionOptions = useMemo(() => {
    const present = new Set(sharedWith.map((row) => row.email));
    return suggestions
      .map((contact) => ({
        value: normalizeEmail(contact.handle),
        display: normalizeEmail(contact.handle),
      }))
      .filter((option) => !present.has(option.value));
  }, [suggestions, sharedWith]);

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
  ];

  const promoteItems: RoleMenuItem[] = [
    { key: 'VIEWER', label: 'Can view', selected: true },
    { key: 'CONTRIBUTOR', label: AlbumMemberRole.contributor.display },
    { key: 'ADMIN', label: AlbumMemberRole.admin.display },
  ];

  return (
    <Surface>
      <AppErrorPanel errors={errors} />
      <MultiCombobox
        // The input never holds pills — every commit (Enter, blur, separator,
        // suggestion pick, paste) flows straight out as rows via onChange.
        value={[]}
        onChange={(next) => {
          if (next.length > 0) {
            onAddEmails(next.map((option) => option.value));
          }
        }}
        items={suggestionOptions}
        allowCustomValue
        validateEntry={validateEmail}
        createCustomItem={(input) => {
          const normalized = normalizeEmail(input);
          return { value: normalized, display: normalized };
        }}
        separators={EMAIL_SEPARATORS}
        placeholder="Add people by email"
        onDeleteItem={onDeleteContact}
        deleteItemLabel="Remove from saved contacts"
      />

      <ScrollWrap>
        <ScrollRegion ref={scrollRef}>
          <Section>
            <GroupHeader>
              Members <GroupCount>· {members.length}</GroupCount>
            </GroupHeader>
            {membersLoading && members.length === 0 ? (
              <MutedRow>Loading people…</MutedRow>
            ) : (
              <RowList>
                {sortedMembers.map((member) => {
                  const isOwner = member.role.equals(AlbumMemberRole.owner);
                  const busy = busyKey === member.id;
                  return (
                    <PersonRow key={member.id} $tone="default">
                      <PersonText>
                        <PersonName>
                          {member.firstName} {member.lastName}
                        </PersonName>
                        <PersonSub>{member.email}</PersonSub>
                      </PersonText>
                      <PersonAction>
                        {isOwner ? (
                          <StaticRole>Owner</StaticRole>
                        ) : !canManageMembers ? (
                          <StaticRole>{member.role.display}</StaticRole>
                        ) : (
                          <>
                            <RoleMenu
                              triggerLabel={member.role.display}
                              items={memberRoleItems(member)}
                              disabled={busy}
                              aria-label={`Change role for ${member.firstName} ${member.lastName}`}
                              onSelect={(key) =>
                                onChangeMemberRole(member.id, key as 'CONTRIBUTOR' | 'ADMIN')
                              }
                            />
                            <RemoveButton
                              type="button"
                              aria-label={`Remove ${member.firstName} ${member.lastName} from album`}
                              title="Remove from album"
                              disabled={busy}
                              onClick={() => onRemoveMember(member.id)}
                            >
                              <X size={16} strokeWidth={2} aria-hidden />
                            </RemoveButton>
                          </>
                        )}
                      </PersonAction>
                    </PersonRow>
                  );
                })}
              </RowList>
            )}
          </Section>

          <Section>
            <GroupHeader>
              Shared with <GroupCount>· {sharedWithCount}</GroupCount>
            </GroupHeader>
            {sharedWith.length === 0 ? (
              sharedWithStatus === 'loading' ? (
                <MutedRow>Loading…</MutedRow>
              ) : sharedWithStatus === 'degraded' ? (
                <MutedRow>Sharing info unavailable right now.</MutedRow>
              ) : (
                /* S4 — the empty state lives in the shared-with region, never
               replacing the whole body. COPY-REVIEW(RAI-79): draft wording;
               the second title covers albums that have members but no
               view-only shares, where "Only you" would be false. */
                <EmptyState>
                  <EmptyTitle>
                    {members.length <= 1
                      ? 'Only you can see this album'
                      : 'Not shared beyond its members yet'}
                  </EmptyTitle>
                  <EmptySub>Add someone&apos;s email above to share it</EmptySub>
                </EmptyState>
              )
            ) : (
              <RowList>
                {sharedWith.map((row) => {
                  const inFlight = row.state === 'resolving' || row.state === 'sharing';
                  const settled = row.state === 'shared' || row.state === 'persisted';
                  const busy = busyKey === row.email;
                  // A bounced invite borrows the S2 error edge — same visual weight,
                  // different cause. It does NOT become row.state 'failed': the grant
                  // exists, so the row keeps its access controls and its place in the
                  // header count.
                  const deliveryFailed =
                    row.state !== 'failed' &&
                    row.delivery?.state.equals(EmailDeliveryState.failed) === true;
                  const tone =
                    row.state === 'failed' || deliveryFailed
                      ? 'failed'
                      : inFlight
                        ? 'pending'
                        : row.state === 'shared'
                          ? 'justAdded'
                          : 'default';
                  return (
                    <PersonRow key={row.email} $tone={tone}>
                      <PersonText>
                        <PersonName>{row.displayName ?? row.email}</PersonName>
                        {row.state === 'failed' && row.error ? (
                          <PersonError role="alert">{row.error.message}</PersonError>
                        ) : inFlight ? (
                          <PersonSub>
                            <Spinner aria-hidden /> Checking…
                          </PersonSub>
                        ) : row.state === 'shared' ? (
                          <PersonSub>
                            {row.hasAccount === false
                              ? 'Invited just now · No account yet'
                              : 'Invited just now'}
                          </PersonSub>
                        ) : row.hasAccount === false ? (
                          <PersonSub>No account yet</PersonSub>
                        ) : row.displayName ? (
                          <PersonSub>{row.email}</PersonSub>
                        ) : null}
                        {/* Send-failed rows already carry their own error; don't
                            stack a delivery note under it. */}
                        {row.state === 'failed' ? null : <DeliveryNote delivery={row.delivery} />}
                      </PersonText>
                      <PersonAction>
                        {row.state === 'failed' ? (
                          <>
                            {/* Never offer retry on something that will always fail —
                          terminal errors (already has access, deactivated) get
                          the × only. */}
                            {row.error?.retryable ? (
                              <Button
                                type="button"
                                variant="secondary"
                                size="small"
                                onClick={() => onRetry(row.email)}
                              >
                                Retry
                              </Button>
                            ) : null}
                            <RemoveButton
                              type="button"
                              aria-label={`Dismiss ${row.email}`}
                              title="Dismiss"
                              onClick={() => onDismissFailed(row.email)}
                            >
                              <X size={16} strokeWidth={2} aria-hidden />
                            </RemoveButton>
                          </>
                        ) : (
                          <>
                            {settled &&
                            row.hasAccount === true &&
                            row.userId != null &&
                            canPromote ? (
                              <RoleMenu
                                triggerLabel="Can view"
                                items={promoteItems}
                                disabled={busy}
                                aria-label={`Access level for ${row.email}`}
                                onSelect={(key) => {
                                  if (
                                    (key === 'CONTRIBUTOR' || key === 'ADMIN') &&
                                    row.userId != null
                                  ) {
                                    onPromote(row.email, row.userId, key);
                                  }
                                }}
                              />
                            ) : (
                              // Membership requires an active account — no-account
                              // (and still-resolving) rows are pinned to "Can view".
                              <StaticRole>Can view</StaticRole>
                            )}
                            <RemoveButton
                              type="button"
                              aria-label={`Remove access for ${row.email}`}
                              title="Remove access"
                              disabled={busy || inFlight}
                              onClick={() => onRemoveAccess(row.email)}
                            >
                              <X size={16} strokeWidth={2} aria-hidden />
                            </RemoveButton>
                          </>
                        )}
                      </PersonAction>
                    </PersonRow>
                  );
                })}
              </RowList>
            )}
          </Section>
        </ScrollRegion>
        <EdgeFade $edge="top" $visible={!atStart} aria-hidden />
        <EdgeFade $edge="bottom" $visible={!atEnd} aria-hidden />
      </ScrollWrap>
    </Surface>
  );
};

/**
 * Fixed-header / scrolling-roster split: the error panel and email input stay
 * put; only the roster region between them and the public-link footer scrolls.
 * min-height: 0 on the flex chain is load-bearing — without it the flex
 * children refuse to shrink below content height and nothing ever scrolls.
 */
const Surface = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  flex: 1 1 auto;
  min-height: 0;
`;

/** Non-scrolling anchor for the edge fades (absolute children of a scroller
    would scroll along with the rows). */
const ScrollWrap = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
`;

const ScrollRegion = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(3)};
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
`;

/** Scroll cue at a clipped edge — fades rows out into the modal background. */
const EdgeFade = styled.div<{ $edge: 'top' | 'bottom'; $visible: boolean }>`
  position: absolute;
  left: 0;
  right: 0;
  height: ${({ theme }) => theme.spacing(3)};
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 150ms ease;
  ${({ $edge, theme }) =>
    $edge === 'top'
      ? `top: 0; background: linear-gradient(to bottom, ${theme.color.body}, transparent);`
      : `bottom: 0; background: linear-gradient(to top, ${theme.color.body}, transparent);`}
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const GroupHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSize._12};
  font-weight: ${({ theme }) => theme.weight.medium};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color.bodyTextMuted};
`;

const GroupCount = styled.span`
  letter-spacing: normal;
`;

const RowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

/* Lightly tinted, borderless, rounded — no per-row borders (too much nesting
   inside a modal). 'pending' = S1 (in flight, reduced opacity); 'justAdded' =
   S5 (warm highlight this session, back to normal on the next open);
   'failed' = S2, the one tone that DOES carry a border — the error edge. */
const PersonRow = styled.div<{ $tone: 'default' | 'pending' | 'justAdded' | 'failed' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.5)};
  background: ${({ theme, $tone }) =>
    $tone === 'justAdded'
      ? theme.color.selectionBg
      : $tone === 'failed'
        ? theme.color.alertError
        : theme.color.bodyRaised};
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'failed' ? theme.color.formError : 'transparent')};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  opacity: ${({ $tone }) => ($tone === 'pending' ? 0.65 : 1)};
  transition:
    background-color 400ms ease,
    opacity 200ms ease;
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
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;

const PersonError = styled.span`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.formError};
`;

/** Quiet confirmation — muted, never competing with the person's name. */
const DeliveredNote = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.bodyTextMuted};
`;

const PersonAction = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  flex-shrink: 0;
`;

const StaticRole = styled.span`
  font-size: ${({ theme }) => theme.fontSize._13};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  padding: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
`;

const RemoveButton = styled.button`
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

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

/** Small inline spinner for the S1 "Checking…" subline. */
const Spinner = styled.span`
  display: inline-block;
  width: ${({ theme }) => theme.spacing(1.25)};
  height: ${({ theme }) => theme.spacing(1.25)};
  border: 2px solid ${({ theme }) => theme.color.borderSubtle};
  border-top-color: ${({ theme }) => theme.color.loadingSpinner};
  border-radius: 50%;
  animation: ${spin} 700ms linear infinite;
`;

const MutedRow = styled.div`
  padding: ${({ theme }) => theme.spacing(1)} 0;
  font-size: ${({ theme }) => theme.fontSize._13};
  color: ${({ theme }) => theme.color.bodyTextMuted};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(2.5)} ${({ theme }) => theme.spacing(1.5)};
  background: ${({ theme }) => theme.color.bodyRaised};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  text-align: center;
`;

const EmptyTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.bodyText};
`;

const EmptySub = styled.span`
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
