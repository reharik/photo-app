import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { colors } from '../styles/colors';
import { MaxWidthBreakpoint } from '../styles/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'large' | 'small';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
};

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const focusRing = ($variant: ButtonVariant): ReturnType<typeof css> => {
  const ringColor =
    $variant === 'primary' ? 'bodyText' : ('textAccent' as 'bodyText' | 'textAccent');
  return css`
    &:focus-visible:not(:disabled):not([aria-busy='true']) {
      outline: 2px solid ${({ theme }) => theme.color[ringColor]};
      outline-offset: 2px;
    }
  `;
};

const variantStyles = ($variant: ButtonVariant): ReturnType<typeof css> => {
  switch ($variant) {
    case 'secondary':
      return css`
        background: ${({ theme }) => theme.color.secondaryButtonBg};
        color: ${({ theme }) => theme.color.secondaryButtonText};
        border-color: ${({ theme }) => theme.color.secondaryButtonBorder};

        &:hover:not(:disabled):not([aria-busy='true']) {
          background: ${({ theme }) => theme.color.secondaryButtonHover};
        }

        &:active:not(:disabled):not([aria-busy='true']) {
          transform: translateY(0.5px);
          background: ${colors.gray_20};
        }
      `;
    case 'ghost':
      return css`
        background: transparent;
        color: ${({ theme }) => theme.color.ghostButtonText};
        border-color: transparent;

        &:hover:not(:disabled):not([aria-busy='true']) {
          color: ${({ theme }) => theme.color.bodyText};
        }

        &:active:not(:disabled):not([aria-busy='true']) {
          transform: translateY(0.5px);
          background: rgba(0, 0, 0, 0.04);
        }
      `;
    case 'danger':
      return css`
        background: ${({ theme }) => theme.color.dangerButtonBg};
        color: ${({ theme }) => theme.color.dangerButtonText};
        border-color: ${({ theme }) => theme.color.dangerButtonBg};

        &:hover:not(:disabled):not([aria-busy='true']) {
          filter: brightness(1.05);
        }

        &:active:not(:disabled):not([aria-busy='true']) {
          transform: translateY(0.5px);
          filter: brightness(0.95);
        }
      `;
    default:
      return css`
        background: ${({ theme }) => theme.color.primaryButtonBg};
        color: ${({ theme }) => theme.color.primaryButtonText};
        border-color: transparent;

        &:hover:not(:disabled):not([aria-busy='true']) {
          background: ${({ theme }) => theme.color.primaryButtonHover};
        }

        &:active:not(:disabled):not([aria-busy='true']) {
          transform: translateY(0.5px);
          background: ${colors.clay_darkest};
        }
      `;
  }
};

const sizeStyles = ($size: ButtonSize, $variant: ButtonVariant): ReturnType<typeof css> => {
  if ($size === 'small') {
    const primarySmall = css`
      &:hover:not(:disabled):not([aria-busy='true']) {
        opacity: 0.92;
        background: ${({ theme }) => theme.color.primaryButtonBg};
      }

      &:active:not(:disabled):not([aria-busy='true']) {
        transform: translateY(0.5px);
        opacity: 0.85;
        filter: brightness(0.95);
        background: ${({ theme }) => theme.color.primaryButtonBg};
      }
    `;

    return css`
      padding: ${({ theme }) => `${theme.spacing(0.75)} ${theme.spacing(2)}`};
      font-size: ${({ theme }) => theme.fontSize._13};
      font-weight: ${({ theme }) => theme.weight.medium};

      @media (max-width: ${MaxWidthBreakpoint.Mobile}px) {
        padding: ${({ theme }) =>
          $variant === 'primary'
            ? `${theme.spacing(0.75)} ${theme.spacing(1.5)}`
            : `${theme.spacing(0.75)} ${theme.spacing(2)}`};
      }

      ${
        $variant === 'ghost'
          ? css`
              padding: ${({ theme }) => `${theme.spacing(0.75)} ${theme.spacing(1)}`};
              min-width: 0;
              flex-shrink: 1;
              overflow: hidden;
              text-overflow: ellipsis;
            `
          : ''
      }

      ${$variant === 'primary' ? primarySmall : ''}
    `;
  }

  return css`
    padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
    font-size: ${({ theme }) => theme.fontSize._14};
    font-weight: ${({ theme }) => theme.weight.medium};

    @media (max-width: 768px) {
      padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
      font-size: ${({ theme }) => theme.fontSize._13};
      font-weight: ${({ theme }) =>
        $variant === 'primary' ? theme.weight.semi : theme.weight.medium};
    }
  `;
};

const ButtonBase = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  white-space: nowrap;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    opacity 0.15s ease,
    filter 0.15s ease,
    transform 0.05s ease;

  ${({ $size, $variant }) => sizeStyles($size, $variant)}
  ${({ $variant }) => variantStyles($variant)}
  ${({ $variant }) => focusRing($variant)}

  &[aria-busy='true'] {
    cursor: wait;
    opacity: 0.9;
    pointer-events: none;
  }

  &:disabled:not([aria-busy='true']) {
    cursor: not-allowed;
    opacity: ${({ $size }) => ($size === 'small' ? 0.55 : 0.7)};
    transform: none;
    filter: none;
  }
`;

const IconSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
`;

const Label = styled.span`
  min-width: 0;
`;

const Spinner = styled.span<{ $size: ButtonSize }>`
  width: ${({ $size }) => ($size === 'small' ? '12px' : '14px')};
  height: ${({ $size }) => ($size === 'small' ? '12px' : '14px')};
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.75s linear infinite;
  flex-shrink: 0;
  opacity: 0.9;
`;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'large',
      leadingIcon,
      trailingIcon,
      fullWidth = false,
      loading = false,
      disabled,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isBlocked = disabled === true || loading;

    return (
      <ButtonBase
        ref={ref}
        type={type}
        disabled={isBlocked}
        aria-busy={loading ? true : undefined}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        {...rest}
      >
        {loading ? (
          <Spinner $size={size} aria-hidden />
        ) : leadingIcon ? (
          <IconSlot aria-hidden>{leadingIcon}</IconSlot>
        ) : null}
        {children ? <Label>{children}</Label> : null}
        {!loading && trailingIcon ? <IconSlot aria-hidden>{trailingIcon}</IconSlot> : null}
      </ButtonBase>
    );
  },
);

Button.displayName = 'Button';
