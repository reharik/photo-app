import { useApolloClient, useQuery } from '@apollo/client/react';
import { AlbumMemberRole, AlbumMemberSortBy, Operation, SortDir } from '@packages/contracts';
import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import type { AppError, ContractErrorPayload } from '../../../domain/errors/errorTypes';
import { mapContractError } from '../../../domain/errors/mapToError';
import { executeMutation } from '../../../domain/graphql/executeMutation';
import {
  AddAlbumMembersDocument,
  type AddAlbumMembersMutation,
  AlbumMembersDocument,
  AlbumSharingExtrasDocument,
  CreatePublicLinkForAlbumDocument,
  type CreatePublicLinkForAlbumMutation,
  GrantUserAuthorizationForAlbumDocument,
  type GrantUserAuthorizationForAlbumMutation,
  RemoveAlbumMembersDocument,
  type RemoveAlbumMembersMutation,
  ResolveShareRecipientsDocument,
  RevokePublicLinkAuthenticationDocument,
  type RevokePublicLinkAuthenticationMutation,
  RevokeShareAuthenticationDocument,
  type RevokeShareAuthenticationMutation,
  type ShareContactType,
  UpdateAlbumMemberRoleDocument,
  type UpdateAlbumMemberRoleMutation,
  ViewerShareContactsDocument,
} from '../../../graphql/generated/types';
import { useAppMutationState } from '../../../hooks/useAppMutation';
import { AppModal } from '../../../ui/AppModal';
import { ConfirmationModal } from '../../../ui/ConfirmationModal';
import { useDeleteShareContact } from '../useDeleteShareContact';
import type { PublicLinkState } from './PublicLinkSection';
import { PublicLinkSection } from './PublicLinkSection';
import type { LocalShareRow, SharedWithRowVM } from './shareAlbumTypes';
import { ShareSurface } from './ShareSurface';

type ShareAlbumModalProps = {
  albumId: string;
  albumOperations: Operation[];
  onSuccessToast?: (message: string) => void;
  onErrorToast?: (message: string) => void;
  onClose: () => void;
};

const MEMBERS_PAGE_LIMIT = 200;

/**
 * The actions that interpose a confirm. The weight tracks the CAPABILITY, not
 * the action: promotion and member removal change what a person can do, and a
 * link reset kills tokens in the wild — so they confirm. Removing a
 * shared-with row doesn't (re-sharing is trivial, nothing is lost).
 */
type PendingConfirm =
  | { kind: 'promote'; email: string; userId: string; role: 'CONTRIBUTOR' | 'ADMIN' }
  | { kind: 'removeMember'; albumMemberId: string }
  | { kind: 'resetLink' };

const normalizeEmail = (input: string): string => input.trim().toLowerCase();

const buildShareUrl = (token: string): string => {
  if (typeof window === 'undefined') {
    return `/shared/${token}`;
  }
  return `${window.location.origin}/shared/${token}`;
};

/**
 * Per-recipient failures come off the wire as a bare error code.
 * mapContractError resolves it against the local ContractError catalog
 * (authoritative for message/category/retryable); a code this build's catalog
 * doesn't know (deploy skew) degrades to a generic, non-retryable error
 * instead of throwing.
 */
const toAppError = (error: ContractErrorPayload): AppError => {
  try {
    return mapContractError(error);
  } catch {
    return {
      code: error.code,
      message: 'Sharing failed',
      source: 'backend',
      category: 'SYSTEM',
      retryable: false,
    };
  }
};

/**
 * The share modal: ONE surface, no modes. Committing an email shares it
 * immediately as a view-only access_grant (least privilege — never a silent
 * membership); promoting to member is a separate action on the roster row and
 * writes an album_member row via AddAlbumMembers. Two tables, two lifecycles,
 * two permission gates — the UI mirrors that instead of hiding it behind a
 * compose flow.
 */
export const ShareAlbumModal = ({
  albumId,
  albumOperations,
  onSuccessToast,
  onErrorToast,
  onClose,
}: ShareAlbumModalProps) => {
  const client = useApolloClient();
  /** Rows added this session — born 'sending', settle to 'shared'/'failed'. */
  const [localRows, setLocalRows] = useState<LocalShareRow[]>([]);
  const [busyKey, setBusyKey] = useState<string | undefined>(undefined);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | undefined>(undefined);

  const memberMutation = useAppMutationState();
  const removeMemberMutation = useAppMutationState();
  const revokeMutation = useAppMutationState();
  const resetMutation = useAppMutationState();
  const promoteMutation = useAppMutationState();
  const createLinkMutation = useAppMutationState();

  const { deleteContact } = useDeleteShareContact(onErrorToast);

  const membersQuery = useQuery(AlbumMembersDocument, {
    variables: {
      albumId,
      input: {
        collectionInfo: {
          pageInfo: { limit: MEMBERS_PAGE_LIMIT, offset: 0 },
          sortBy: AlbumMemberSortBy.role,
          sortDir: SortDir.asc,
        },
      },
    },
    fetchPolicy: 'cache-and-network',
  });

  // emailShares/publicLink are in the schema but their resolvers may not be
  // implemented yet; until they are, this query errors at runtime and the UI
  // degrades (no shared-with rows, link section shows unavailable) instead of
  // blocking the members list.
  const extrasQuery = useQuery(AlbumSharingExtrasDocument, {
    variables: { albumId },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const contactsQuery = useQuery(ViewerShareContactsDocument, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
  });
  const suggestions: ShareContactType[] = useMemo(
    () => contactsQuery.data?.viewer?.shareContacts ?? [],
    [contactsQuery.data],
  );

  const members = useMemo(
    () => membersQuery.data?.viewer?.album?.albumMembers.nodes ?? [],
    [membersQuery.data],
  );
  const extrasAlbum = extrasQuery.data?.viewer?.album;
  // The persisted roster carries its own account info (displayName/hasAccount/
  // userId on EmailShare) — these are people the viewer has ALREADY shared
  // with, so nothing routes through the rate-limited resolve oracle here.
  const serverShares = useMemo(() => extrasAlbum?.emailShares ?? [], [extrasAlbum]);

  /**
   * One batched account-resolution call for TYPED/PASTED input only. Failure
   * (network, rate limit) degrades to an empty map — affected rows render
   * conservatively (no promote dropdown), never as memberships.
   */
  const fetchResolution = useCallback(
    async (
      emails: string[],
    ): Promise<Map<string, { hasAccount: boolean; displayName?: string }>> => {
      try {
        const result = await client.query({
          query: ResolveShareRecipientsDocument,
          variables: { albumId, emails },
          fetchPolicy: 'no-cache',
        });
        return new Map(
          (result.data?.viewer?.album?.resolveShareRecipients.data ?? []).map((recipient) => [
            normalizeEmail(recipient.email),
            { hasAccount: recipient.resolved, displayName: recipient.displayName },
          ]),
        );
      } catch {
        return new Map();
      }
    },
    [albumId, client],
  );

  /** Resolve THIS SESSION'S adds (updates the pending local rows in place). */
  const resolveLocalRows = useCallback(
    async (emails: string[]): Promise<void> => {
      const resolved = await fetchResolution(emails);
      const requested = new Set(emails);
      setLocalRows((prev) =>
        prev.map((row) => {
          if (!requested.has(row.email) || row.resolution !== 'pending') {
            return row;
          }
          const match = resolved.get(row.email);
          const hasAccount = match?.hasAccount === true;
          return {
            ...row,
            resolution: hasAccount ? 'account' : 'noAccount',
            displayName: hasAccount ? match?.displayName : undefined,
          };
        }),
      );
    },
    [fetchResolution],
  );

  /**
   * Share a batch (length 1 or N — Enter and paste go through the SAME path).
   * grantUserAuthorizationForAlbum writes view-only grants, full stop — the
   * operation set is pinned server-side, so sharing can never grant edit
   * rights; elevation is the deliberate promote action on the row.
   */
  const shareEmails = useCallback(
    async (emails: string[]): Promise<void> => {
      // Deliberately NOT useAppMutationState: its in-flight guard would fail a
      // second batch committed while the first is still on the wire.
      const result = await executeMutation(
        client,
        {
          mutation: GrantUserAuthorizationForAlbumDocument,
          variables: {
            input: {
              albumId,
              grantedToHandles: emails,
            },
          },
        },
        (data: GrantUserAuthorizationForAlbumMutation) => data.grantUserAuthorizationForAlbum,
      );
      const requested = new Set(emails);

      if (!result.success) {
        // Whole-operation failure (auth/validation/network): nothing was
        // shared. Every row in the batch fails with the envelope error.
        const error = result.errors[0];
        setLocalRows((prev) =>
          prev.map((row) =>
            requested.has(row.email) && row.sendState === 'sending'
              ? { ...row, sendState: 'failed', error }
              : row,
          ),
        );
        return;
      }

      const succeeded = new Set(result.data.succeeded.map((entry) => normalizeEmail(entry.email)));
      const failedByEmail = new Map(
        result.data.failed.map((entry) => [normalizeEmail(entry.email), toAppError(entry.error)]),
      );
      setLocalRows((prev) =>
        prev.map((row) => {
          if (!requested.has(row.email)) {
            return row;
          }
          if (succeeded.has(row.email)) {
            return { ...row, sendState: 'shared' as const, error: undefined };
          }
          const error = failedByEmail.get(row.email);
          return error ? { ...row, sendState: 'failed' as const, error } : row;
        }),
      );
      if (succeeded.size > 0) {
        void extrasQuery.refetch();
      }
    },
    [albumId, client, extrasQuery],
  );

  /**
   * THE add handler — array in (length 1 for Enter/blur/suggestion, N for
   * paste), one resolve call + one share call per batch. Emails already
   * present as rows are dropped (dedupe on add is a no-op, not an error).
   */
  const handleAddEmails = useCallback(
    (emails: string[]) => {
      // Members count as "already a row" too — sharing with a member is a
      // no-op, not an error.
      const present = new Set([
        ...localRows.map((row) => row.email),
        ...serverShares.map((share) => normalizeEmail(share.email)),
        ...members.map((member) => normalizeEmail(member.email)),
      ]);
      const fresh = [...new Set(emails.map(normalizeEmail))].filter(
        (email) => email.length > 0 && !present.has(email),
      );
      if (fresh.length === 0) {
        return;
      }
      setLocalRows((prev) => [
        ...prev,
        ...fresh.map((email): LocalShareRow => ({
          email,
          resolution: 'pending',
          sendState: 'sending',
        })),
      ]);
      void resolveLocalRows(fresh);
      void shareEmails(fresh);
    },
    [localRows, serverShares, members, resolveLocalRows, shareEmails],
  );

  const handleDismissFailed = useCallback((email: string) => {
    setLocalRows((prev) => prev.filter((row) => row.email !== email));
  }, []);

  /** S2 retry: put the failed row back in flight and re-run the share path. */
  const handleRetry = useCallback(
    (email: string) => {
      setLocalRows((prev) =>
        prev.map((row) =>
          row.email === email && row.sendState === 'failed'
            ? { ...row, sendState: 'sending', error: undefined }
            : row,
        ),
      );
      void shareEmails([email]);
    },
    [shareEmails],
  );

  const handleChangeMemberRole = async (
    albumMemberId: string,
    role: 'CONTRIBUTOR' | 'ADMIN',
  ): Promise<void> => {
    setBusyKey(albumMemberId);
    const result = await memberMutation.execute(
      {
        mutation: UpdateAlbumMemberRoleDocument,
        variables: {
          input: {
            albumId,
            albumMemberId,
            role: role === 'ADMIN' ? AlbumMemberRole.admin : AlbumMemberRole.contributor,
          },
        },
      },
      (data: UpdateAlbumMemberRoleMutation) => data.UpdateAlbumMemberRole,
    );
    setBusyKey(undefined);
    if (result.success) {
      await membersQuery.refetch();
    }
  };

  /** Executor behind the remove-member confirm (a real capability change). */
  const handleRemoveMember = async (albumMemberId: string): Promise<void> => {
    setBusyKey(albumMemberId);
    const result = await removeMemberMutation.execute(
      {
        mutation: RemoveAlbumMembersDocument,
        variables: { input: { albumId, albumMemberIds: [albumMemberId] } },
      },
      (data: RemoveAlbumMembersMutation) => data.RemoveAlbumMembers,
    );
    setBusyKey(undefined);
    if (result.success) {
      setPendingConfirm(undefined);
      onSuccessToast?.('Removed from album');
      // Both rosters move: the member row disappears, and if the person still
      // holds a view grant they surface back in SHARED WITH (the server
      // excludes members from emailShares, so the extras data is stale now).
      await Promise.all([membersQuery.refetch(), extrasQuery.refetch()]);
    }
  };

  /**
   * Promote a shared-with account holder to member. By the time this control
   * exists the access_grant is already written, so this is purely the
   * membership write: AddAlbumMembers (gated on addMembers) — never a re-run
   * of the share path. The grant is NOT revoked; grants are additive, and the
   * roster's precedence rule renders the person as a member from now on.
   * Runs behind the promote confirm.
   */
  const handlePromote = async (
    email: string,
    userId: string,
    role: 'CONTRIBUTOR' | 'ADMIN',
  ): Promise<void> => {
    setBusyKey(email);
    const result = await promoteMutation.execute(
      {
        mutation: AddAlbumMembersDocument,
        variables: {
          input: {
            albumId,
            userIds: [userId],
            role: role === 'ADMIN' ? AlbumMemberRole.admin : AlbumMemberRole.contributor,
          },
        },
      },
      (data: AddAlbumMembersMutation) => data.AddAlbumMembers,
    );
    setBusyKey(undefined);
    if (result.success) {
      setPendingConfirm(undefined);
      onSuccessToast?.('Added as a member');
      // The person renders as a member now — the local share row is done.
      setLocalRows((prev) => prev.filter((row) => row.email !== email));
      await Promise.all([membersQuery.refetch(), extrasQuery.refetch()]);
    }
  };

  // No confirm: removing a shared-with row loses nothing — re-sharing is
  // trivial. (Member removal, a real capability change, is the one that
  // confirms.)
  const handleRemoveAccess = async (email: string): Promise<void> => {
    // The revoke mutation keys on the authorization id, which only the
    // persisted EmailShare row carries — a just-shared row can't be revoked
    // until the refetch after the share lands its server twin.
    const share = serverShares.find((s) => normalizeEmail(s.email) === email);
    if (!share) {
      onErrorToast?.('This share is still saving — try again in a moment.');
      return;
    }
    setBusyKey(email);
    const result = await revokeMutation.execute(
      {
        mutation: RevokeShareAuthenticationDocument,
        variables: { input: { albumId, authorizationId: share.id } },
      },
      (data: RevokeShareAuthenticationMutation) => data.RevokeShareAuthentication,
    );
    setBusyKey(undefined);
    if (result.success) {
      onSuccessToast?.('Access removed');
      setLocalRows((prev) => prev.filter((row) => row.email !== email));
      await extrasQuery.refetch();
    }
  };

  const handleCreateLink = async (): Promise<void> => {
    const result = await createLinkMutation.execute(
      {
        mutation: CreatePublicLinkForAlbumDocument,
        variables: { input: { albumId } },
      },
      (data: CreatePublicLinkForAlbumMutation) => data.createPublicLinkForAlbum,
    );
    if (result.success) {
      await extrasQuery.refetch();
    }
  };

  const handleResetLink = async (): Promise<void> => {
    const result = await resetMutation.execute(
      {
        mutation: RevokePublicLinkAuthenticationDocument,
        variables: { input: { albumId } },
      },
      (data: RevokePublicLinkAuthenticationMutation) => data.RevokePublicLinkAuthentication,
    );
    if (result.success) {
      setPendingConfirm(undefined);
      onSuccessToast?.('Public link reset');
      await extrasQuery.refetch();
    }
  };

  /**
   * Server rows merged with this session's local rows (local state is
   * fresher, but the server twin is the only source of userId).
   *
   * PRECEDENCE RULE: promotion does not revoke the view grant, so a promoted
   * person holds BOTH an album_member row and an access_grant. Anyone who
   * appears in both lists renders as a MEMBER — stated here explicitly, never
   * left to query ordering.
   */
  const sharedWith: SharedWithRowVM[] = useMemo(() => {
    const memberUserIds = new Set(members.map((member) => member.userId));
    const localEmails = new Set(localRows.map((row) => row.email));
    const serverByEmail = new Map(
      serverShares.map((share) => [normalizeEmail(share.email), share]),
    );

    const rows: SharedWithRowVM[] = serverShares
      .filter((share) => !localEmails.has(normalizeEmail(share.email)))
      .filter((share) => share.userId == null || !memberUserIds.has(share.userId))
      .map((share) => ({
        email: normalizeEmail(share.email),
        displayName: share.hasAccount ? share.displayName : undefined,
        hasAccount: share.hasAccount,
        userId: share.userId,
        state: 'persisted' as const,
      }));

    for (const row of localRows) {
      const server = serverByEmail.get(row.email);
      if (server?.userId != null && memberUserIds.has(server.userId)) {
        continue;
      }
      rows.push({
        email: row.email,
        displayName: row.displayName ?? (server?.hasAccount ? server.displayName : undefined),
        hasAccount:
          row.resolution === 'pending' ? server?.hasAccount : row.resolution === 'account',
        userId: server?.userId,
        state:
          row.sendState === 'failed'
            ? 'failed'
            : row.sendState === 'shared'
              ? 'shared'
              : row.resolution === 'pending'
                ? 'resolving'
                : 'sharing',
        error: row.error,
      });
    }
    return rows;
  }, [members, serverShares, localRows]);

  // Failed rows are visible (they need their error + retry) but are NOT access —
  // they never count toward the header.
  const sharedWithCount = sharedWith.filter((row) => row.state !== 'failed').length;

  const publicLinkState: PublicLinkState = useMemo(() => {
    if (extrasQuery.loading && !extrasQuery.data) {
      return { kind: 'loading' };
    }
    if (!extrasAlbum) {
      return { kind: 'unavailable' };
    }
    // Nullable by design: null = never created. Never mint one on read.
    if (!extrasAlbum.publicLink) {
      return { kind: 'absent' };
    }
    return extrasAlbum.publicLink.token
      ? { kind: 'present', url: buildShareUrl(extrasAlbum.publicLink.token) }
      : { kind: 'unavailable' };
  }, [extrasQuery.loading, extrasQuery.data, extrasAlbum]);

  const sharedWithStatus: 'loading' | 'ready' | 'degraded' = extrasAlbum
    ? 'ready'
    : extrasQuery.loading
      ? 'loading'
      : 'degraded';

  // Promote / remove-member / reset errors render inside their confirm
  // dialogs, which stay open on failure — only inline-committing actions
  // surface here.
  const surfaceErrors: AppError[] = [
    ...memberMutation.errors,
    ...revokeMutation.errors,
    ...createLinkMutation.errors,
  ];

  // Copy targets for the open confirm (name lookups happen at render time so
  // a refetch can't strand a stale name in the dialog).
  const promoteConfirm = pendingConfirm?.kind === 'promote' ? pendingConfirm : undefined;
  const promoteName = promoteConfirm
    ? (sharedWith.find((row) => row.email === promoteConfirm.email)?.displayName ??
      promoteConfirm.email)
    : undefined;
  const removeConfirm = pendingConfirm?.kind === 'removeMember' ? pendingConfirm : undefined;
  const removeMemberRecord = removeConfirm
    ? members.find((member) => member.id === removeConfirm.albumMemberId)
    : undefined;
  const removeMemberName = removeMemberRecord
    ? `${removeMemberRecord.firstName} ${removeMemberRecord.lastName}`
    : 'this member';

  const requestClose = useCallback(() => {
    // A nested confirmation modal is open: its own Escape/cancel handling wins.
    if (pendingConfirm) {
      return;
    }
    onClose();
  }, [pendingConfirm, onClose]);

  return (
    <>
      <AppModal onClose={requestClose} title="Share album" maxWidth="560px">
        <ModalLayout>
          <ShareSurface
            members={members}
            membersLoading={membersQuery.loading}
            sharedWith={sharedWith}
            sharedWithCount={sharedWithCount}
            sharedWithStatus={sharedWithStatus}
            suggestions={suggestions}
            albumOperations={albumOperations}
            errors={surfaceErrors}
            busyKey={busyKey}
            onAddEmails={handleAddEmails}
            onChangeMemberRole={(albumMemberId, role) =>
              void handleChangeMemberRole(albumMemberId, role)
            }
            onRemoveMember={(albumMemberId) =>
              setPendingConfirm({ kind: 'removeMember', albumMemberId })
            }
            onPromote={(email, userId, role) =>
              setPendingConfirm({ kind: 'promote', email, userId, role })
            }
            onRemoveAccess={(email) => void handleRemoveAccess(email)}
            onRetry={handleRetry}
            onDismissFailed={handleDismissFailed}
            onDeleteContact={deleteContact}
          />
          <PublicLinkWrap>
            <PublicLinkSection
              link={publicLinkState}
              creating={createLinkMutation.isLoading}
              onCreate={() => void handleCreateLink()}
              onRequestReset={() => setPendingConfirm({ kind: 'resetLink' })}
            />
          </PublicLinkWrap>
        </ModalLayout>
      </AppModal>

      {promoteConfirm && (
        <ConfirmationModal
          onClose={() => setPendingConfirm(undefined)}
          onConfirm={() =>
            handlePromote(promoteConfirm.email, promoteConfirm.userId, promoteConfirm.role)
          }
          isSubmitting={promoteMutation.isLoading}
          mutationErrors={promoteMutation.errors}
          confirmTone="default"
          title={
            promoteConfirm.role === 'ADMIN'
              ? `Make ${promoteName} an admin?`
              : `Make ${promoteName} a contributor?`
          }
          /*
            COPY-REVIEW(RAI-79): draft wording — needs product review before
            ship. A real capability change one dropdown-click away; the body
            spells out what the role can actually do.
          */
          body={
            <ConfirmBody>
              {promoteConfirm.role === 'ADMIN'
                ? 'They’ll be able to add and remove photos, and manage this album’s members and sharing.'
                : 'They’ll be able to add and remove photos.'}
            </ConfirmBody>
          }
          confirmLabel={promoteConfirm.role === 'ADMIN' ? 'Make admin' : 'Make contributor'}
          confirmingLabel="Saving…"
        />
      )}

      {removeConfirm && (
        <ConfirmationModal
          onClose={() => setPendingConfirm(undefined)}
          onConfirm={() => handleRemoveMember(removeConfirm.albumMemberId)}
          isSubmitting={removeMemberMutation.isLoading}
          mutationErrors={removeMemberMutation.errors}
          title={`Remove ${removeMemberName} from this album?`}
          /*
            COPY-REVIEW(RAI-79): draft wording — needs product review before
            ship. Confirms because membership is a real capability being taken
            away (removing a view-only share deliberately does NOT confirm).
          */
          body={
            <ConfirmBody>
              They&apos;ll no longer be a member — they lose the ability to add photos, and this
              album leaves their list. You can add them back at any time.
            </ConfirmBody>
          }
          confirmLabel="Remove"
          confirmingLabel="Removing…"
        />
      )}

      {pendingConfirm?.kind === 'resetLink' && (
        <ConfirmationModal
          onClose={() => setPendingConfirm(undefined)}
          onConfirm={handleResetLink}
          isSubmitting={resetMutation.isLoading}
          mutationErrors={resetMutation.errors}
          title="Reset public link?"
          /*
            COPY-REVIEW(RAI-79): draft wording — needs product review before ship.
            Semantics per RAI-79: reset kills EVERY anonymous token on the album
            (the copied link, forwarded copies, and former email-invite tokens
            shed on signup). Memberships survive; pending email invites survive
            (named, individually targetable).
          */
          body={
            <ConfirmBody>
              The current link stops working, along with any copies people have forwarded. Anyone
              using one loses access immediately. People you invited by email keep their access. A
              new link is issued — you&apos;ll need to share it again.
            </ConfirmBody>
          }
          confirmLabel="Reset link"
          confirmingLabel="Resetting…"
        />
      )}
    </>
  );
};

/**
 * Three-region layout: fixed input (in ShareSurface), scrolling roster (in
 * ShareSurface), fixed public-link footer. max-height CAPS the modal — with a
 * short roster the column sizes to content, so no dead space; only past the
 * cap does the roster region start scrolling.
 */
const ModalLayout = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  min-height: 0;
`;

const PublicLinkWrap = styled.div`
  flex-shrink: 0;
  margin-top: ${({ theme }) => theme.spacing(3)};
`;

const ConfirmBody = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._14};
  line-height: 1.5;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
