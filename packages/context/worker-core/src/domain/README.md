# Domain Model

Core business concepts for the photo sharing app. Use this to guide API and persistence design.

## Entities

| Entity           | Responsibility                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**         | Application user identity.                                                                                                                   |
| **Photo**        | Uploaded media asset owned by a user; has storage key, media metadata (mimeType, size, width, height), optional title, description, takenAt. |
| **Album**        | Collection of photos with an owner.                                                                                                          |
| **AlbumPhoto**   | Association between Album and Photo; who added the photo and when (createdBy, createdAt).                                                    |
| **AlbumMember**  | Association between User and Album with a role (viewer, contributor, admin).                                                                 |
| **ShareLink**    | Token-based sharing for an Album or Photo with permissions and optional expiration.                                                          |
| **Comment**      | User comment attached to an Album or Photo.                                                                                                  |
| **Notification** | User-facing event record (e.g. shares, comments, added photos).                                                                              |

## Value Types

- **ResourceKind**: `album` | `photo` (target of ShareLink or Comment)
- **AlbumMemberRole**: `viewer` | `contributor` | `admin`
- **ShareLinkPermission**: `view` | `comment` | `contribute`
- **NotificationKind**: `share_invite` | `album_shared` | `photo_added` | `comment` | `comment_reply`

## Relationships

- User **owns** many Photos (Photo.ownerId)
- User **owns** many Albums (Album.ownerId)
- Photo **appears in** many Albums via AlbumPhoto
- Album **has** many members via AlbumMember (User + role)
- Album or Photo **can be shared** via ShareLink (linkToken, permissions, optional expiresAt)
- Album or Photo **can have** Comments
- User **receives** Notifications

## Permissions

- **Ownership**: Album.ownerId and Photo.ownerId imply full control.
- **AlbumMember.role**: viewer (view only), contributor (view + add/remove photos in album), admin (manage members + contributor).
- **ShareLink.permissions**: view, comment, contribute; applied to anyone with the valid link token until expiresAt (if set).

## Invariants

Domain entities enforce their own invariants. Application services enforce business rules when creating or updating entities. Validation helpers can be added in the application layer or as pure functions used by domain/application as needed.
