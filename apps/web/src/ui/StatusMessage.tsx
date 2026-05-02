/**
 * StatusMessage — an inline feedback component for success / error /
 * warning / info states. Simplified from the Linus InfoMessage pattern,
 * with no external dependencies (framer-motion, i18n, icon library).
 */
import React, { ReactElement } from 'react';
import styled from 'styled-components';

type StatusVariant = 'success' | 'error' | 'warning' | 'info';

export interface StatusMessageProps {
  variant: StatusVariant;
  children: React.ReactNode;
  show?: boolean;
}

export const StatusMessage = ({
  variant,
  children,
  show = true,
}: StatusMessageProps): ReactElement | null => {
  if (!show) return null;

  return (
    <Wrapper $variant={variant}>
      <Indicator $variant={variant} />
      <Text $variant={variant}>{children}</Text>
    </Wrapper>
  );
};

const variantColorMap = {
  success: 'alertSuccessText',
  error: 'alertErrorText',
  warning: 'alertWarningText',
  info: 'alertInfoText',
} as const;

const variantBgMap = {
  success: 'alertSuccess',
  error: 'alertError',
  warning: 'alertWarning',
  info: 'alertInfo',
} as const;

const Wrapper = styled.div<{ $variant: StatusVariant }>(
  ({ theme: { spacing, borderRadius } }) => `
    display: flex;
    align-items: center;
    gap: ${spacing(1)};
    padding: ${spacing(1)} ${spacing(1.5)};
    border-radius: ${borderRadius.sm};
  `,
);

const Indicator = styled.div<{ $variant: StatusVariant }>(
  ({ $variant, theme: { color } }) => `
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    background: ${color[variantBgMap[$variant]]};
  `,
);

const Text = styled.span<{ $variant: StatusVariant }>(
  ({ $variant, theme: { color, fontSize } }) => `
    color: ${color[variantColorMap[$variant]]};
    font-size: ${fontSize._14};
    line-height: 1.4;
  `,
);
