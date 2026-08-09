/**
 * PRE-SDL DOCUMENTS — RAI-79 share modal redesign.
 *
 * Every document in this file is hand-authored AHEAD of the backend SDL. None of
 * these operations exist in the schema yet; they define the contract the new share
 * modal needs. When the SDL lands, each moves to a normal .graphql file under
 * src/graphql/{queries,mutations}/ (so codegen owns it) and its hand-written types
 * here get deleted. Grep for "PRE-SDL" to find them all.
 *
 * This file deliberately lives OUTSIDE src/graphql/** so the codegen glob
 * (codegen.yml `documents`) never sees these operations — a document referencing
 * schema-less fields would fail codegen validation for everyone.
 *
 * Types follow the codegen conventions of src/graphql/generated/types.ts:
 * nullable = `T | undefined`, no __typename (skipTypename), enums from
 * @packages/contracts.
 */
import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { ContractErrorPayload } from '../../../domain/errors/errorTypes';

/**
 * PRE-SDL enum: the access level offered when sharing by email. VIEWER maps
 * server-side to a share grant (fixed view/download/comment operation set per the
 * locked model), NOT a membership; CONTRIBUTOR/ADMIN map to AlbumMemberRole
 * memberships. Becomes a schema enum (+ generated smart-enum) when the SDL lands.
 */
export type ShareAccessLevel = 'VIEWER' | 'CONTRIBUTOR' | 'ADMIN';

// Graduated to the real schema (documents now in src/graphql/queries/):
//  - AlbumSharingExtras (Album.emailShares + Album.publicLink)
//  - ResolveShareRecipients (batched, rate limited)

// ---------------------------------------------------------------------------
// PRE-SDL: batch share with per-recipient outcomes. Backend notes:
//  - Replaces grantUserAuthorizationForAlbum for the album share path. Recipients
//    are emails; resolution happens server-side (the resolve query above returns
//    no ids on purpose). accessLevel VIEWER → share grant; CONTRIBUTOR/ADMIN →
//    membership.
//  - Errors send only the error CODE; the client resolves display/category/
//    retryable from the local ContractError catalog via the code. Nothing else
//    crosses the wire (an unknown code — deploy skew — renders a generic
//    message and is never retryable).
//  - The envelope `errors` array remains whole-operation failures only (auth,
//    validation), so the existing normalizeMutationPayload contract still
//    holds: partial failures ride INSIDE data, never in the envelope.
//  - This is the UI the all-or-nothing guard in grantAuthorizationForAlbum.ts
//    (media-core) is waiting on; the domain's IndependentGroupResult
//    {succeeded, failed} must be surfaced instead of collapsed to
//    PartialShareFailure.
// ---------------------------------------------------------------------------

export type ShareAlbumWithRecipientsInput = {
  albumId: string;
  recipients: Array<{ email: string; accessLevel: ShareAccessLevel }>;
  message: string | undefined;
};

export type ShareAlbumWithRecipientsMutation = {
  shareAlbumWithRecipients: {
    data:
      | {
          succeeded: Array<{ email: string }>;
          failed: Array<{ email: string; error: ContractErrorPayload }>;
        }
      | undefined;
    errors: ContractErrorPayload[] | undefined;
  };
};

export type ShareAlbumWithRecipientsMutationVariables = {
  input: ShareAlbumWithRecipientsInput;
};

export const ShareAlbumWithRecipientsDocument = gql`
  mutation ShareAlbumWithRecipients($input: ShareAlbumWithRecipientsInput!) {
    shareAlbumWithRecipients(input: $input) {
      data {
        succeeded {
          email
        }
        failed {
          email
          error {
            code
          }
        }
      }
      errors {
        code
      }
    }
  }
` as TypedDocumentNode<ShareAlbumWithRecipientsMutation, ShareAlbumWithRecipientsMutationVariables>;

// ---------------------------------------------------------------------------
// PRE-SDL: change an existing member's role inline (manage mode). No such
// mutation exists — AddAlbumMembers/RemoveAlbumMembers only. Backend notes:
// role is CONTRIBUTOR/ADMIN only; OWNER transfers are out of scope.
// ---------------------------------------------------------------------------

export type UpdateAlbumMemberRoleInput = {
  albumId: string;
  albumMemberId: string;
  role: 'CONTRIBUTOR' | 'ADMIN';
};

export type UpdateAlbumMemberRoleMutation = {
  updateAlbumMemberRole: {
    data: { albumMemberId: string; role: string } | undefined;
    errors: ContractErrorPayload[] | undefined;
  };
};

export type UpdateAlbumMemberRoleMutationVariables = {
  input: UpdateAlbumMemberRoleInput;
};

export const UpdateAlbumMemberRoleDocument = gql`
  mutation UpdateAlbumMemberRole($input: UpdateAlbumMemberRoleInput!) {
    updateAlbumMemberRole(input: $input) {
      data {
        albumMemberId
        role
      }
      errors {
        code
      }
    }
  }
` as TypedDocumentNode<UpdateAlbumMemberRoleMutation, UpdateAlbumMemberRoleMutationVariables>;

// ---------------------------------------------------------------------------
// PRE-SDL: revoke an email share (the × on a "No account yet" row). Kills that
// recipient's named LinkAuth — which per RAI-79 prunes their whole forward-tree.
// ---------------------------------------------------------------------------

export type RevokeEmailShareInput = {
  albumId: string;
  email: string;
};

export type RevokeEmailShareMutation = {
  revokeEmailShare: {
    data: { email: string } | undefined;
    errors: ContractErrorPayload[] | undefined;
  };
};

export type RevokeEmailShareMutationVariables = {
  input: RevokeEmailShareInput;
};

export const RevokeEmailShareDocument = gql`
  mutation RevokeEmailShare($input: RevokeEmailShareInput!) {
    revokeEmailShare(input: $input) {
      data {
        email
      }
      errors {
        code
      }
    }
  }
` as TypedDocumentNode<RevokeEmailShareMutation, RevokeEmailShareMutationVariables>;

// ---------------------------------------------------------------------------
// PRE-SDL: reset the public link. Per RAI-79 this is a KILL-ALL: every anonymous
// token on the album dies (the copied link plus all conversion-anonymized former
// LinkAuths), then one fresh token is issued and returned. Named LinkAuths
// (email shares that haven't converted) survive.
// ---------------------------------------------------------------------------

export type ResetPublicLinkForAlbumInput = {
  albumId: string;
};

export type ResetPublicLinkForAlbumMutation = {
  resetPublicLinkForAlbum: {
    data: { token: string } | undefined;
    errors: ContractErrorPayload[] | undefined;
  };
};

export type ResetPublicLinkForAlbumMutationVariables = {
  input: ResetPublicLinkForAlbumInput;
};

export const ResetPublicLinkForAlbumDocument = gql`
  mutation ResetPublicLinkForAlbum($input: ResetPublicLinkForAlbumInput!) {
    resetPublicLinkForAlbum(input: $input) {
      data {
        token
      }
      errors {
        code
      }
    }
  }
` as TypedDocumentNode<ResetPublicLinkForAlbumMutation, ResetPublicLinkForAlbumMutationVariables>;
