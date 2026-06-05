import styled from 'styled-components';

type MediaGridDateSectionProps = {
  label: string;
  subtitle: string;
  location?: string;
  children: React.ReactNode;
};

// Section header is non-sticky in v1. Sticky bucket labels on scroll (Apple/Google Photos
// style) need intersection observers and swap logic — deferred to a future PR.
export const MediaGridDateSection = ({
  label,
  subtitle,
  location,
  children,
}: MediaGridDateSectionProps) => {
  const subtitleText =
    location != null && location.trim() !== ''
      ? `${subtitle} · ${location.trim()}`
      : subtitle;

  return (
    <Section>
      <Header>
        <SectionLabel>{label}</SectionLabel>
        {subtitleText !== '' ? <SectionSubtitle>{subtitleText}</SectionSubtitle> : null}
      </Header>
      {children}
    </Section>
  );
};

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1.5)};
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  min-width: 0;
`;

const SectionLabel = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.textAccent};
  min-width: 0;
`;

const SectionSubtitle = styled.span`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.fontSize._12};
  color: ${({ theme }) => theme.color.textMuted};
`;
