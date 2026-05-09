import styled, { type DefaultTheme } from 'styled-components';

type Props = {
  displayName: string;
  displayAvatarUrl?: string | null;
  size?: number;
};

const AVATAR_BG_KEYS = [
  'avatarBg1',
  'avatarBg2',
  'avatarBg3',
  'avatarBg4',
  'avatarBg5',
  'avatarBg6',
] as const satisfies (keyof DefaultTheme['color'])[];

const hashName = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % AVATAR_BG_KEYS.length;
};

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const CommentAvatar = ({ displayName, displayAvatarUrl, size = 32 }: Props) => {
  if (displayAvatarUrl) {
    return (
      <AvatarImage
        src={displayAvatarUrl}
        alt={displayName}
        $size={size}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  const bgKey = AVATAR_BG_KEYS[hashName(displayName)];

  return (
    <AvatarInitials $size={size} $bgKey={bgKey} aria-label={displayName}>
      {initials(displayName)}
    </AvatarInitials>
  );
};

const AvatarImage = styled.img<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const AvatarInitials = styled.span<{
  $size: number;
  $bgKey: (typeof AVATAR_BG_KEYS)[number];
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ theme, $bgKey }) => theme.color[$bgKey]};
  color: ${({ theme }) => theme.color.avatarText};
  font-size: ${({ $size }) => Math.round($size * 0.4)}px;
  font-weight: ${({ theme }) => theme.weight.semi};
  flex-shrink: 0;
  user-select: none;
`;
