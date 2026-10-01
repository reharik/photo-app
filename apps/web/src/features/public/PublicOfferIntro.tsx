import styled from 'styled-components';

type PublicOfferIntroProps = {
  /** '' when the owner has no resolvable name — the attribution line is then omitted. */
  ownerName: string;
  /** The desktop header block hugs its trailing edge; the sheet and the rail read left-aligned. */
  align?: 'left' | 'right';
};

/**
 * The copy above the email field, shared by the desktop offer and the mobile sheet so the two
 * cannot drift: what this is, who sent it, and what Homeroll is. The last line exists because
 * a guest arriving from an emailed link has never heard of the product she is being asked to
 * sign up for.
 */
export const PublicOfferIntro = ({ ownerName, align = 'left' }: PublicOfferIntroProps) => (
  <Root $align={align}>
    <Lead>A living album</Lead>
    {ownerName !== '' ? <Attribution>shared with you by {ownerName}</Attribution> : null}
    <About>Homeroll is a private place for family photos.</About>
  </Root>
);

const Root = styled.div<{ $align: 'left' | 'right' }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
  min-width: 0;
  text-align: ${({ $align }) => $align};
`;

// Serif, matching the wordmark's register — this is the line that has to sound like a
// keepsake rather than a product feature.
const Lead = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._21};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  line-height: 1.3;
`;

const Attribution = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyTextMuted};
  line-height: 1.4;
`;

const About = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  line-height: 1.4;
`;
