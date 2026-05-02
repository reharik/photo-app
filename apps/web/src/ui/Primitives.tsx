// src/ui/Primitives.tsx
import React from 'react';
import styled, { css } from 'styled-components';

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

// ── Button ──────────────────────────────────────────────────────

const ButtonBase = styled.button<{
  $variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  $size?: 'sm' | 'md';
  $fullWidth?: boolean;
}>`
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ $size = 'md' }) => ($size === 'sm' ? '8px 10px' : '10px 14px')};
  cursor: pointer;
  font-weight: ${({ theme }) => theme.weight.semi};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:disabled {
    cursor: not-allowed;
    background: ${({ theme }) => theme.color.buttonDisabled};
    color: ${({ theme }) => theme.color.buttonDisabledText};
    border-color: transparent;
  }

  ${({ $variant = 'primary', theme }) => {
    switch ($variant) {
      case 'secondary':
        return css`
          background: ${theme.color.secondaryButtonBg};
          color: ${theme.color.secondaryButtonText};
          border-color: ${theme.color.secondaryButtonBorder};
          &:hover:not(:disabled) {
            background: ${theme.color.secondaryButtonHover};
          }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: ${theme.color.ghostButtonText};
          &:hover:not(:disabled) {
            color: ${theme.color.bodyText};
            background: ${theme.color.ghostButtonHover};
          }
        `;
      case 'danger':
        return css`
          background: ${theme.color.dangerButtonBg};
          color: ${theme.color.dangerButtonText};
          &:hover:not(:disabled) {
            filter: brightness(1.1);
          }
        `;
      default:
        return css`
          background: ${theme.color.primaryButtonBg};
          color: ${theme.color.primaryButtonText};
          &:hover:not(:disabled) {
            background: ${theme.color.primaryButtonHover};
          }
        `;
    }
  }}
`;

type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, fullWidth, ...rest }, ref) => (
    <ButtonBase ref={ref} $variant={variant} $size={size} $fullWidth={fullWidth} {...rest} />
  ),
);
Button.displayName = 'Button';

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
