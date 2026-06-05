import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

export type AnchoredMenuAlign = 'start' | 'end';

type AnchoredMenuProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  menuRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  align?: AnchoredMenuAlign;
  offset?: number;
  className?: string;
  role?: string;
  'aria-label'?: string;
  style?: CSSProperties;
};

export const AnchoredMenu = ({
  open,
  anchorRef,
  menuRef,
  children,
  align = 'end',
  offset = 4,
  className,
  role = 'menu',
  'aria-label': ariaLabel,
  style,
}: AnchoredMenuProps) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | undefined>(undefined);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(undefined);
      return;
    }

    const updatePosition = (): void => {
      const anchor = anchorRef.current;
      if (anchor == null) {
        return;
      }
      const rect = anchor.getBoundingClientRect();
      setCoords({
        top: rect.bottom + offset,
        left: align === 'end' ? rect.right : rect.left,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, anchorRef, align, offset]);

  if (!open || coords == null) {
    return null;
  }

  return createPortal(
    <MenuPanel
      ref={menuRef}
      className={className}
      role={role}
      aria-label={ariaLabel}
      style={style}
      $top={coords.top}
      $left={coords.left}
      $align={align}
    >
      {children}
    </MenuPanel>,
    document.body,
  );
};

const MenuPanel = styled.div<{
  $top: number;
  $left: number;
  $align: AnchoredMenuAlign;
}>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  transform: translateX(${({ $align }) => ($align === 'end' ? '-100%' : '0')});
  z-index: 1000;
  min-width: 180px;
  padding: ${({ theme }) => theme.spacing(0.5)};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.bodyRaised};
  box-shadow: ${({ theme }) => theme.boxShadow.md};
`;
