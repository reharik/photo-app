// src/ui/Primitives.tsx
import React from 'react';
import styled from 'styled-components';

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <VStack gap={1}>
    <Label>{label}</Label>
    {children}
  </VStack>
);

// ── Surfaces ────────────────────────────────────────────────────

export const Card = styled.div`
  background: ${({ theme }) => theme.color.cardBg};
  border: 1px solid ${({ theme }) => theme.color.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.boxShadow.sm};
  padding: ${({ theme }) => theme.spacing(2)};
`;

// ── Layout ──────────────────────────────────────────────────────

const HStackBase = styled.div<{
  $gap?: number;
  $wrap?: boolean;
  $stackOnMobile?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${({ $gap = 2, theme }) => theme.spacing($gap)};
  flex-wrap: ${({ $wrap }) => ($wrap ? 'wrap' : 'nowrap')};

  ${({ theme }) => theme.breakpoints.tabletDown} {
    flex-wrap: wrap;
    ${({ $stackOnMobile }) =>
      $stackOnMobile &&
      `
      flex-direction: column;
      align-items: stretch;
    `}
  }
`;

type HStackProps = React.ComponentPropsWithoutRef<'div'> & {
  gap?: number;
  wrap?: boolean;
  stackOnMobile?: boolean;
};
export const HStack = React.forwardRef<HTMLDivElement, HStackProps>(
  ({ gap, wrap, stackOnMobile, ...rest }, ref) => (
    <HStackBase ref={ref} $gap={gap} $wrap={wrap} $stackOnMobile={stackOnMobile} {...rest} />
  ),
);
HStack.displayName = 'HStack';

const VStackBase = styled.div<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 2, theme }) => theme.spacing($gap)};
`;

type VStackProps = React.ComponentPropsWithoutRef<'div'> & { gap?: number };
export const VStack = React.forwardRef<HTMLDivElement, VStackProps>(({ gap, ...rest }, ref) => (
  <VStackBase ref={ref} $gap={gap} {...rest} />
));
VStack.displayName = 'VStack';

export const Spacer = styled.div`
  flex: 1 1 auto;
`;

// ── Form helpers ────────────────────────────────────────────────

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.label};
`;

export { Button } from './Button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './Button';

// ── Badge ───────────────────────────────────────────────────────

export const Badge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.color.bodyElevated};
  border: 1px solid ${({ theme }) => theme.color.border};
  color: ${({ theme }) => theme.color.textSecondary};
  font-size: ${({ theme }) => theme.fontSize._12};
`;

// ── Table ───────────────────────────────────────────────────────

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.color.tableBorder};
  }
  th {
    color: ${({ theme }) => theme.color.tableHeaderText};
    font-weight: ${({ theme }) => theme.weight.semi};
  }
  tr:hover td {
    background: ${({ theme }) => theme.color.cellHoverBg};
  }
`;
