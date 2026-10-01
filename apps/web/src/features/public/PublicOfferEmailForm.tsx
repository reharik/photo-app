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
  /**
   * Mobile sheet: the field takes the panel width and the Join button sits full-width below
   * it. Otherwise (desktop band) the button sits inline to the field's right.
   */
  fullWidth?: boolean;
};

/**
 * Labelled email field + clay "Join" submit, shared by the desktop reveal and the mobile sheet
 * so the courier semantics exist in exactly one place.
 *
 * The label says "Email this was sent to" because an emailed invite only activates the album
 * for the address it was sent to: signing up with a different one yields an account and no
 * album. It is a real <label>, not a placeholder — a placeholder vanishes the moment she
 * starts typing, which is exactly when the instruction matters.
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
      <Label htmlFor={inputId}>Email this was sent to</Label>
      <Controls $fullWidth={fullWidth}>
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <SubmitButton type="submit" data-testid="public-offer-submit">
          Join
        </SubmitButton>
      </Controls>
    </Form>
  );
};

const Form = styled.form<{ $fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.75)};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  min-width: 0;
`;

const Label = styled.label`
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.bodyText};
  line-height: 1.4;
  text-align: left;
`;

const Controls = styled.div<{ $fullWidth: boolean }>`
  display: flex;
  flex-direction: ${({ $fullWidth }) => ($fullWidth ? 'column' : 'row')};
  align-items: ${({ $fullWidth }) => ($fullWidth ? 'stretch' : 'center')};
  gap: ${({ theme, $fullWidth }) => theme.spacing($fullWidth ? 1.5 : 1)};
  min-width: 0;
`;

const EmailInput = styled.input<{ $fullWidth: boolean }>`
  flex: 0 1 auto;
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : '300px')};
  min-width: 0;
  min-height: 40px;
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

  &:focus {
    border-color: ${({ theme }) => theme.color.inputBorderFocus};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.color.inputBorderFocus}26`};
  }

  /* 44px tap target, and 16px text — anything smaller makes iOS Safari zoom the
     viewport on focus, which would jerk the sheet out from under her. */
  @media (max-width: 768px) {
    min-height: 44px;
    font-size: ${({ theme }) => theme.fontSize._16};
  }
`;

// Clay filled, with a word on it — a bare arrow did not say what pressing it would do.
const SubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 40px;
  padding: 0 ${({ theme }) => theme.spacing(3)};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.primaryButtonText};
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.medium};
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
    min-height: 48px;
  }
`;
