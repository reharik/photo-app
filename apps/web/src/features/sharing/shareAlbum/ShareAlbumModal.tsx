import { useApolloClient, useQuery } from '@apollo/client/react';
import { AlbumMemberSortBy, Operation, SortDir } from '@packages/contracts';
import { ArrowLeft } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { AppError, ContractErrorPayload } from '../../../domain/errors/errorTypes';
import { mapContractError } from '../../../domain/errors/mapToError';
import {
  AlbumMembersDocument,
  AlbumSharingExtrasDocument,
  RemoveAlbumMembersDocument,
  type RemoveAlbumMembersMutation,
  ResolveShareRecipientsDocument,
  type ShareContactType,
  ViewerShareContactsDocument,
} from '../../../graphql/generated/types';
import { useAppMutationState } from '../../../hooks/useAppMutation';
import { AppModal } from '../../../ui/AppModal';
import { Button } from '../../../ui/Button';
import { ConfirmationModal } from '../../../ui/ConfirmationModal';
import { useDeleteShareContact } from '../useDeleteShareContact';
import { ComposePanel } from './ComposePanel';
import { ManagePanel } from './ManagePanel';
import {
  ResetPublicLinkForAlbumDocument,
  type ResetPublicLinkForAlbumMutation,
  RevokeEmailShareDocument,
  type RevokeEmailShareMutation,
  type ShareAccessLevel,
  ShareAlbumWithRecipientsDocument,
  type ShareAlbumWithRecipientsMutation,
  UpdateAlbumMemberRoleDocument,
  type UpdateAlbumMemberRoleMutation,
} from './preSdlShareDocuments';
import type { PendingRecipient } from './shareAlbumTypes';

type ShareAlbumModalProps = {
  albumId: string;
  albumOperations: Operation[];
  onSuccessToast?: (message: string) => void;
  onErrorToast?: (message: string) => void;
  onClose: () => void;
};

type Mode = 'manage' | 'compose';

const MEMBERS_PAGE_LIMIT = 200;

/** Pause before auto-returning to manage once the compose list empties. */
const RETURN_TO_MANAGE_DELAY_MS = 800;

/**
 * Emails added in quick succession (typing with comma/semicolon commits, or a
 * paste followed by more typing) coalesce into ONE resolveShareRecipients call
 * carrying the whole batch, instead of a request per committed email.
 */
const RESOLVE_BATCH_DELAY_MS = 400;

const trimmedOrUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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
 * The Google-Drive-pattern share modal: MANAGE (default — review access, copy
 * the persistent public link, inline role changes) and COMPOSE (add people by
 * email, entered by typing in manage). A mode switch, not tabs.
 */
export const ShareAlbumModal = ({
  albumId,
  albumOperations,
  onSuccessToast,
  onErrorToast,
  onClose,
}: ShareAlbumModalProps) => {
  const client = useApolloClient();
  const [mode, setMode] = useState<Mode>('manage');
  const [recipients, setRecipients] = useState<PendingRecipient[]>([]);
  const [message, setMessage] = useState('');
  const [busyKey, setBusyKey] = useState<string | undefined>(undefined);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [hasAttemptedSend, setHasAttemptedSend] = useState(false);

  const memberMutation = useAppMutationState();
  const revokeMutation = useAppMutationState();
  const resetMutation = useAppMutationState();
  const shareMutation = useAppMutationState();

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
  // degrades (no email-share rows, link field shows "unavailable") instead of
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

  const members = membersQuery.data?.viewer?.album?.albumMembers.nodes ?? [];
  const emailShares = (extrasQuery.data?.viewer?.album?.emailShares ?? []).map(
    (share) => share.email,
  );
  const publicLinkToken = extrasQuery.data?.viewer?.album?.publicLink?.token;

  const manageErrors: AppError[] = [...memberMutation.errors, ...revokeMutation.errors];

  /**
   * Resolve a batch of typed emails against active accounts in one query
   * (compose-row asymmetry). If resolution fails outright (network, rate
   * limit), every row degrades to the conservative no-account rendering —
   * a view link, never a membership.
   */
  const resolveRecipients = useCallback(
    async (emails: string[]): Promise<void> => {
      let resolvedByEmail = new Map<string, { resolved: boolean; displayName?: string }>();
      try {
        const result = await client.query({
          query: ResolveShareRecipientsDocument,
          variables: { albumId, emails },
          fetchPolicy: 'no-cache',
        });
        resolvedByEmail = new Map(
          (result.data?.viewer?.album?.resolveShareRecipients.data ?? []).map((recipient) => [
            recipient.email.toLowerCase(),
            { resolved: recipient.resolved, displayName: recipient.displayName },
          ]),
        );
      } catch {
        // fall through with an empty map — all rows resolve to noAccount
      }
      const requested = new Set(emails);
      setRecipients((prev) =>
        prev.map((recipient) => {
          if (!requested.has(recipient.email) || recipient.resolution !== 'pending') {
            return recipient;
          }
          const match = resolvedByEmail.get(recipient.email);
          const hasAccount = match?.resolved === true;
          return {
            ...recipient,
            resolution: hasAccount ? 'account' : 'noAccount',
            displayName: hasAccount ? match?.displayName : undefined,
            // Membership requires an active account; unresolved emails are
            // pinned to the view-link level.
            accessLevel: hasAccount ? recipient.accessLevel : 'VIEWER',
          };
        }),
      );
    },
    [albumId, client],
  );

  // Pending-resolution queue: adds collect here and flush as one array call.
  const pendingResolveRef = useRef<Set<string>>(new Set());
  const resolveTimerRef = useRef<number | undefined>(undefined);

  const queueResolve = useCallback(
    (emails: string[]) => {
      for (const email of emails) {
        pendingResolveRef.current.add(email);
      }
      if (resolveTimerRef.current != null) {
        window.clearTimeout(resolveTimerRef.current);
      }
      resolveTimerRef.current = window.setTimeout(() => {
        resolveTimerRef.current = undefined;
        const batch = [...pendingResolveRef.current];
        pendingResolveRef.current.clear();
        if (batch.length > 0) {
          void resolveRecipients(batch);
        }
      }, RESOLVE_BATCH_DELAY_MS);
    },
    [resolveRecipients],
  );

  useEffect(
    () => () => {
      if (resolveTimerRef.current != null) {
        window.clearTimeout(resolveTimerRef.current);
      }
    },
    [],
  );

  const addRecipients = useCallback(
    (emails: string[]) => {
      const known = new Set(recipients.map((recipient) => recipient.email));
      const fresh = [...new Set(emails.map((email) => email.trim().toLowerCase()))].filter(
        (email) => email.length > 0 && !known.has(email),
      );
      if (fresh.length > 0) {
        setRecipients((prev) => [
          ...prev,
          ...fresh.map((email): PendingRecipient => ({
            email,
            accessLevel: 'CONTRIBUTOR',
            resolution: 'pending',
            sendState: 'draft',
          })),
        ]);
        queueResolve(fresh);
      }
      setMode('compose');
    },
    [recipients, queueResolve],
  );

  const resetComposeState = useCallback(() => {
    setRecipients([]);
    setMessage('');
    setSentCount(0);
    setHasAttemptedSend(false);
    setMode('manage');
  }, []);

  /**
   * Send a subset of recipients (initial send = all drafts; retries = one or
   * all retryable failures). Partial failure keeps us in compose: succeeded
   * rows disappear, failed rows stay with their error inline.
   */
  const sendRecipients = useCallback(
    async (subset: PendingRecipient[]): Promise<void> => {
      if (subset.length === 0) {
        return;
      }
      const emails = new Set(subset.map((recipient) => recipient.email));
      setRecipients((prev) =>
        prev.map((recipient) =>
          emails.has(recipient.email)
            ? { ...recipient, sendState: 'sending', error: undefined }
            : recipient,
        ),
      );

      const result = await shareMutation.execute(
        {
          mutation: ShareAlbumWithRecipientsDocument,
          variables: {
            input: {
              albumId,
              recipients: subset.map((recipient) => ({
                email: recipient.email,
                accessLevel: recipient.accessLevel,
              })),
              message: trimmedOrUndefined(message),
            },
          },
        },
        (data: ShareAlbumWithRecipientsMutation) => data.shareAlbumWithRecipients,
      );
      setHasAttemptedSend(true);

      if (!result.success) {
        // Whole-operation failure (auth/validation/network): nothing was
        // shared. Rows return to draft; the envelope errors render in the panel.
        setRecipients((prev) =>
          prev.map((recipient) =>
            emails.has(recipient.email) ? { ...recipient, sendState: 'draft' } : recipient,
          ),
        );
        return;
      }

      const succeeded = new Set(result.data.succeeded.map((entry) => entry.email));
      const failedByEmail = new Map(
        result.data.failed.map((entry) => [entry.email, toAppError(entry.error)]),
      );
      setSentCount((prev) => prev + succeeded.size);
      setRecipients((prev) =>
        prev
          .filter((recipient) => !succeeded.has(recipient.email))
          .map((recipient) => {
            const error = failedByEmail.get(recipient.email);
            if (error) {
              return { ...recipient, sendState: 'failed' as const, error };
            }
            return emails.has(recipient.email)
              ? { ...recipient, sendState: 'draft' as const }
              : recipient;
          }),
      );
    },
    [albumId, message, shareMutation],
  );

  const handleSend = useCallback(() => {
    void sendRecipients(recipients.filter((recipient) => recipient.sendState === 'draft'));
  }, [recipients, sendRecipients]);

  const handleRetryRecipient = useCallback(
    (email: string) => {
      void sendRecipients(recipients.filter((recipient) => recipient.email === email));
    },
    [recipients, sendRecipients],
  );

  const handleRetryAll = useCallback(() => {
    void sendRecipients(
      recipients.filter(
        (recipient) => recipient.sendState === 'failed' && recipient.error?.retryable,
      ),
    );
  }, [recipients, sendRecipients]);

  const handleChangeAccessLevel = useCallback((email: string, level: ShareAccessLevel) => {
    setRecipients((prev) =>
      prev.map((recipient) =>
        recipient.email === email ? { ...recipient, accessLevel: level } : recipient,
      ),
    );
  }, []);

  const handleRemoveRecipient = useCallback((email: string) => {
    setRecipients((prev) => prev.filter((recipient) => recipient.email !== email));
  }, []);

  // Once a send has happened and the compose list empties (all succeeded, or
  // the last failed row was retried/dismissed), return to manage — after a
  // beat, rather than swapping instantly on the last click.
  useEffect(() => {
    if (mode !== 'compose' || !hasAttemptedSend || recipients.length > 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (sentCount > 0) {
        onSuccessToast?.(`Shared with ${sentCount} ${sentCount === 1 ? 'person' : 'people'}`);
      }
      resetComposeState();
      void membersQuery.refetch();
      void extrasQuery.refetch();
    }, RETURN_TO_MANAGE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [
    mode,
    hasAttemptedSend,
    recipients.length,
    sentCount,
    onSuccessToast,
    resetComposeState,
    membersQuery,
    extrasQuery,
  ]);

  /** Back arrow / close guard: confirm before discarding pending recipients. */
  const requestLeaveCompose = useCallback(() => {
    if (recipients.length > 0) {
      setDiscardConfirmOpen(true);
      return;
    }
    resetComposeState();
  }, [recipients.length, resetComposeState]);

  const requestClose = useCallback(() => {
    // A nested confirmation modal is open: its own Escape/cancel handling wins.
    if (resetConfirmOpen || discardConfirmOpen) {
      return;
    }
    if (mode === 'compose' && recipients.length > 0) {
      setDiscardConfirmOpen(true);
      return;
    }
    onClose();
  }, [resetConfirmOpen, discardConfirmOpen, mode, recipients.length, onClose]);

  const handleChangeMemberRole = async (
    albumMemberId: string,
    role: 'CONTRIBUTOR' | 'ADMIN',
  ): Promise<void> => {
    setBusyKey(albumMemberId);
    const result = await memberMutation.execute(
      {
        mutation: UpdateAlbumMemberRoleDocument,
        variables: { input: { albumId, albumMemberId, role } },
      },
      (data: UpdateAlbumMemberRoleMutation) => data.updateAlbumMemberRole,
    );
    setBusyKey(undefined);
    if (result.success) {
      await membersQuery.refetch();
    }
  };

  const handleRemoveMember = async (albumMemberId: string): Promise<void> => {
    setBusyKey(albumMemberId);
    const result = await memberMutation.execute(
      {
        mutation: RemoveAlbumMembersDocument,
        variables: { input: { albumId, albumMemberIds: [albumMemberId] } },
      },
      (data: RemoveAlbumMembersMutation) => data.RemoveAlbumMembers,
    );
    setBusyKey(undefined);
    if (result.success) {
      onSuccessToast?.('Removed from album');
      await membersQuery.refetch();
    }
  };

  const handleRevokeEmailShare = async (email: string): Promise<void> => {
    setBusyKey(email);
    const result = await revokeMutation.execute(
      {
        mutation: RevokeEmailShareDocument,
        variables: { input: { albumId, email } },
      },
      (data: RevokeEmailShareMutation) => data.revokeEmailShare,
    );
    setBusyKey(undefined);
    if (result.success) {
      onSuccessToast?.('Access revoked');
      await extrasQuery.refetch();
    }
  };

  const handleResetLink = async (): Promise<void> => {
    const result = await resetMutation.execute(
      {
        mutation: ResetPublicLinkForAlbumDocument,
        variables: { input: { albumId } },
      },
      (data: ResetPublicLinkForAlbumMutation) => data.resetPublicLinkForAlbum,
    );
    if (result.success) {
      setResetConfirmOpen(false);
      onSuccessToast?.('Public link reset');
      await extrasQuery.refetch();
    }
  };

  const title =
    mode === 'compose' ? (
      <TitleRow>
        <BackButton type="button" aria-label="Back to people list" onClick={requestLeaveCompose}>
          <ArrowLeft size={18} strokeWidth={2} aria-hidden />
        </BackButton>
        Share album
      </TitleRow>
    ) : (
      'Share album'
    );

  const draftCount = recipients.filter((recipient) => recipient.sendState === 'draft').length;
  const resolutionPending = recipients.some((recipient) => recipient.resolution === 'pending');

  const composeFooter = (
    <>
      <Button
        type="button"
        variant="secondary"
        size="large"
        onClick={requestLeaveCompose}
        disabled={shareMutation.isLoading}
      >
        Cancel
      </Button>
      <Button
        type="button"
        variant="primary"
        size="large"
        loading={shareMutation.isLoading}
        disabled={draftCount === 0 || resolutionPending}
        onClick={handleSend}
      >
        Send
      </Button>
    </>
  );

  return (
    <>
      <AppModal
        onClose={requestClose}
        title={title}
        maxWidth="560px"
        footer={mode === 'compose' ? composeFooter : undefined}
        closeOnBackdropClick={!shareMutation.isLoading}
      >
        {mode === 'manage' ? (
          <ManagePanel
            members={members}
            membersLoading={membersQuery.loading}
            emailShares={emailShares}
            publicLinkToken={publicLinkToken}
            suggestions={suggestions}
            albumOperations={albumOperations}
            errors={manageErrors}
            busyKey={busyKey}
            onStartCompose={addRecipients}
            onChangeMemberRole={(albumMemberId, role) =>
              void handleChangeMemberRole(albumMemberId, role)
            }
            onRemoveMember={(albumMemberId) => void handleRemoveMember(albumMemberId)}
            onRevokeEmailShare={(email) => void handleRevokeEmailShare(email)}
            onRequestResetLink={() => setResetConfirmOpen(true)}
            onDeleteContact={deleteContact}
          />
        ) : (
          <ComposePanel
            recipients={recipients}
            suggestions={suggestions}
            message={message}
            sending={shareMutation.isLoading}
            sentCount={sentCount}
            envelopeErrors={shareMutation.errors}
            onAddEmails={addRecipients}
            onMessageChange={setMessage}
            onChangeAccessLevel={handleChangeAccessLevel}
            onRemoveRecipient={handleRemoveRecipient}
            onRetryRecipient={handleRetryRecipient}
            onRetryAll={handleRetryAll}
            onDeleteContact={deleteContact}
          />
        )}
      </AppModal>

      {resetConfirmOpen && (
        <ConfirmationModal
          onClose={() => setResetConfirmOpen(false)}
          onConfirm={handleResetLink}
          isSubmitting={resetMutation.isLoading}
          mutationErrors={resetMutation.errors}
          title="Reset public link?"
          /*
            COPY-REVIEW(RAI-79): draft wording — needs product review before ship.
            Semantics per RAI-79: reset kills EVERY anonymous token on the album
            (the copied link, forwarded copies, and tokens shed by people who have
            since converted to members). Named email shares that haven't converted
            keep their links; memberships are untouched.
          */
          body={
            <ConfirmBody>
              This turns off the current link for everyone using it — including copies forwarded by
              other people, and old links belonging to people who have since joined this album
              (their membership is not affected). A new link will be created, and you&apos;ll need
              to share it again.
            </ConfirmBody>
          }
          confirmLabel="Reset link"
          confirmingLabel="Resetting…"
        />
      )}

      {discardConfirmOpen && (
        <ConfirmationModal
          onClose={() => setDiscardConfirmOpen(false)}
          onConfirm={() => {
            setDiscardConfirmOpen(false);
            resetComposeState();
          }}
          title="Discard invitations?"
          body={
            <ConfirmBody>
              You haven&apos;t sent these invitations yet. Going back will discard them.
            </ConfirmBody>
          }
          confirmLabel="Discard"
        />
      )}
    </>
  );
};

const TitleRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.spacing(3.5)};
  height: ${({ theme }) => theme.spacing(3.5)};
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.bodyElevated};
    color: ${({ theme }) => theme.color.bodyText};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.inputBorderFocus};
    outline-offset: 1px;
  }
`;

const ConfirmBody = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._14};
  line-height: 1.5;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
