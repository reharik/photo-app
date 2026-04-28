import { Button, Section, Text } from '@react-email/components';
import type { FC } from 'react';
import type { TemplateData } from '../types.js';
import { BaseEmail } from './base.js';

type DigestData = TemplateData['digest'];

export const subject = (data: DigestData): string => {
  const app = data.appName ?? 'PhotoApp';
  return `Your ${data.periodLabel} recap from ${app}`;
};

const Digest: FC<DigestData> = (data) => {
  const appName = data.appName ?? 'PhotoApp';
  const preview = `${data.highlights.length} highlights from ${data.periodLabel}.`;
  return (
    <BaseEmail appName={appName} previewText={preview} title={`${data.periodLabel} digest`}>
      <Section>
        <Text style={greeting}>Hi {data.userName},</Text>
        <Text style={paragraph}>{data.summaryLine}</Text>
      </Section>
      <Section style={{ marginTop: '20px' }}>
        {data.highlights.map((item, index) => (
          <Section key={`${item.title}-${index}`} style={highlightBlock}>
            <Text style={highlightTitle}>{item.title}</Text>
            <Text style={highlightDetail}>{item.detail}</Text>
          </Section>
        ))}
      </Section>
      <Section style={{ marginTop: '24px' }}>
        <Button href={data.digestUrl} style={buttonStyle}>
          Open full digest
        </Button>
      </Section>
    </BaseEmail>
  );
};

const greeting = {
  color: '#18181b',
  fontSize: '15px',
  fontWeight: 600,
  margin: '0 0 8px',
};

const paragraph = {
  color: '#3f3f46',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: 0,
};

const highlightBlock = {
  borderLeft: '3px solid #e4e4e7',
  marginBottom: '16px',
  paddingLeft: '12px',
};

const highlightTitle = {
  color: '#18181b',
  fontSize: '14px',
  fontWeight: 600,
  lineHeight: '1.4',
  margin: '0 0 4px',
};

const highlightDetail = {
  color: '#52525b',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: 0,
};

const buttonStyle = {
  backgroundColor: '#18181b',
  borderRadius: '6px',
  color: '#fafafa',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 20px',
  textDecoration: 'none',
};

export default Digest;
