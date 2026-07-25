import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { buildOfferSignupHref } from './offerSignupHref';

type PublicOfferEmailFormProps = {
  albumId: string;
  /** Unique per instance — desktop reveal and the mobile sheet can both be mounted. */
  inputId: string;
  /** Sheet + reveal both want the caret waiting; see the focus effect below. */
  autoFocus?: boolean;
  /** Mobile sheet stretches to the panel width; the desktop reveal sits inline. */
  fullWidth?: boolean;
};

/**
 * Email field + clay arrow submit, shared by the desktop reveal and the mobile sheet so the
 * courier semantics exist in exactly one place.
 *
 * NOTE the input is `type="text"`, not `type="email"`. That is load-bearing, not an
 * oversight: `type="email"` makes the browser refuse to submit a malformed value and show a
 * native validation bubble, which is precisely the gate this field must not be. `inputMode`
 * and `autoComplete` still give phones the @-keyboard and the address autofill. `noValidate`
 * on the form is the belt to that suspenders.
 */
export const PublicOfferEmailForm = ({
  albumId,
  inputId,
  autoFocus = false,
  fullWidth = false,
}: PublicOfferEmailFormProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');

  // Deferred a frame: the reveal swaps the button out and the sheet slides in, so the input
  // is not laid out yet at effect time. Caveat: iOS Safari only raises the keyboard for a
  // focus() in the same task as the user gesture, so on iOS the caret lands but the keyboard
  // may wait for a tap. A synchronous focus is not available to us here — the element does
  // not exist until after the state change that reveals it.
  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault();
    void navigate(buildOfferSignupHref(albumId, email));
  };

  return (
    <Form onSubmit={handleSubmit} noValidate $fullWidth={fullWidth}>
      <EmailInput
        ref={inputRef}
        $fullWidth={fullWidth}
        id={inputId}
        data-testid="public-offer-email"
        name="email"
        type="text"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Enter your email"
        aria-label="Enter your email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <SubmitArrow type="submit" data-testid="public-offer-submit" aria-label="Continue">
        <ArrowRight size={18} strokeWidth={2} aria-hidden />
      </SubmitArrow>
    </Form>
  );
};

const Form = styled.form<{ $fullWidth: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  min-width: 0;
`;

const EmailInput = styled.input<{ $fullWidth: boolean }>`
  flex: ${({ $fullWidth }) => ($fullWidth ? '1 1 auto' : '0 1 240px')};
  min-width: 0;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(1.5)};
  background: ${({ theme }) => theme.color.inputBg};
  border: 1px solid ${({ theme }) => theme.color.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.color.inputText};
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.regular};
  outline: none;
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;

  &::placeholder {
    color: ${({ theme }) => theme.color.inputPlaceholder};
  }

  &:focus {
    border-color: ${({ theme }) => theme.color.inputBorderFocus};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.color.inputBorderFocus}26`};
  }

  /* 44px tap target, and 16px text — anything smaller makes iOS Safari zoom the
     viewport on focus, which would jerk the sheet out from under her. */
  @media (max-width: 768px) {
    flex: 1 1 auto;
    min-height: 44px;
    font-size: ${({ theme }) => theme.fontSize._16};
  }
`;

// Clay filled arrow — the one place the offer raises its voice, and only once she has
// already opted in by revealing the field.
const SubmitArrow = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.body};
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.color.primaryButtonHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
  }
`;
