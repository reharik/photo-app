import { useEffect, type MouseEvent, type ReactNode } from 'react';
import styled from 'styled-components';

type AppModalProps = {
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  titleId?: string;
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  padding?: number;
};

export const AppModal = ({
  onClose,
  title,
  children,
  footer,
  maxWidth = '480px',
  titleId = 'modal-title',
  closeOnBackdropClick = true,
  showCloseButton = true,
  padding = 4,
}: AppModalProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      onClose();
    }
  };

  const handleDialogClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <Backdrop role="presentation" onClick={handleBackdropClick}>
      <Dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        $maxWidth={maxWidth}
        onClick={handleDialogClick}
      >
        {(title || showCloseButton) && (
          <Header>
            <Title id={titleId}>{title}</Title>
            {showCloseButton && (
              <CloseButton type="button" aria-label="Close modal" onClick={onClose}>
                ×
              </CloseButton>
            )}
          </Header>
        )}

        <Body $padding={padding}>{children}</Body>

        {footer ? <Footer>{footer}</Footer> : null}
      </Dialog>
    </Backdrop>
  );
};

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(3)};
  background: rgba(0, 0, 0, 0.45);
`;

const Dialog = styled.div<{ $maxWidth: string }>`
  width: 100%;
  max-width: ${({ $maxWidth }) => $maxWidth};
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(4)} 0;
`;

const Title = styled.div`
  min-width: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const CloseButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted ?? theme.colors.text};
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
`;

const Body = styled.div<{ $padding: number }>`
  padding: ${({ theme, $padding }) => theme.spacing($padding)};
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: 0 ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(4)};
`;
