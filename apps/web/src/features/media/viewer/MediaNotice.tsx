import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

export type MediaNoticeProps = {
  icon: LucideIcon;
  title: string;
  hint?: string;
  /** Optional control under the hint (e.g. a retry button). */
  action?: ReactNode;
};

/** Centered icon + message shown on the viewer stage in place of media that can't render. */
export const MediaNotice = ({ icon: Icon, title, hint, action }: MediaNoticeProps) => (
  <NoticeBlock role="status">
    <NoticeIcon aria-hidden>
      <Icon size={48} strokeWidth={2} aria-hidden />
    </NoticeIcon>
    <NoticeTitle>{title}</NoticeTitle>
    {hint != null ? <NoticeHint>{hint}</NoticeHint> : null}
    {action}
  </NoticeBlock>
);

const NoticeBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  text-align: center;
  max-width: 320px;
`;

const NoticeIcon = styled.div`
  display: flex;
  color: ${({ theme }) => theme.color.textAccent};
  opacity: 0.35;
`;

const NoticeTitle = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
`;

const NoticeHint = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
