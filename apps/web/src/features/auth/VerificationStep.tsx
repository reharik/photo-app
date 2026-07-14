import styled from 'styled-components';
import { FormInput } from '../../ui/FormInput';

// The verification-code mechanic, extracted out of ForgotPasswordScreen so BOTH doors
// (signup + forgot-password) share one implementation: digit-only masking, the 6-digit
// length rule, and the "Send again" resend row. The parent owns the `code` string and
// the password/name fields around it — this component owns only the code input itself,
// which is the genuinely duplicated, easy-to-drift part.

export const CODE_LENGTH = 6;

// Digit-only, capped at CODE_LENGTH. Callers store the returned string verbatim.
export const sanitizeCode = (raw: string): string => raw.replace(/\D/g, '').slice(0, CODE_LENGTH);

type VerificationStepProps = {
  // Unique per door so ids don't collide if both ever mount.
  idPrefix: string;
  code: string;
  onCodeChange: (code: string) => void;
  onResend: () => void;
  isResending: boolean;
  disabled?: boolean;
};

export const VerificationStep = ({
  idPrefix,
  code,
  onCodeChange,
  onResend,
  isResending,
  disabled = false,
}: VerificationStepProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onCodeChange(sanitizeCode(event.target.value));
  };

  return (
    <>
      <FormInput
        id={`${idPrefix}-code`}
        label="Verification code"
        type="text"
        placeholder="000000"
        value={code}
        onChange={handleChange}
        required
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        data-testid={`${idPrefix}-code`}
      />
      <ResendRow>
        Didn&apos;t get a code?{' '}
        <ResendLink type="button" onClick={onResend} disabled={isResending || disabled}>
          Send again
        </ResendLink>
      </ResendRow>
    </>
  );
};

const ResendRow = styled.div`
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  font-size: 14px;
`;

const ResendLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.color.link};
  font-size: 14px;
  padding: 0;
  text-decoration: underline;
  transition: color 0.2s ease;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.color.linkHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
