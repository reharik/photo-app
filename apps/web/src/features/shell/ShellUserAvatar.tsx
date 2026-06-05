import styled from 'styled-components';

type ShellUserAvatarProps = {
  displayName: string;
  size?: number;
};

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const ShellUserAvatar = ({ displayName, size = 32 }: ShellUserAvatarProps) => {
  return (
    <AvatarCircle $size={size} aria-hidden>
      {initialsFromName(displayName)}
    </AvatarCircle>
  );
};

const AvatarCircle = styled.span<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ theme }) => theme.color.avatarBg1};
  color: ${({ theme }) => theme.color.avatarText};
  font-size: ${({ $size }) => Math.max(11, Math.round($size * 0.38))}px;
  font-weight: ${({ theme }) => theme.weight.medium};
  line-height: 1;
  letter-spacing: 0.02em;
`;
