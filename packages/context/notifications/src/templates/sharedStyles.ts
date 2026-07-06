// emails/templates/shareStyles.ts
export const paragraph = {
  color: '#3f3f46',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 12px',
};
export const muted = { color: '#71717a', fontSize: '12px', lineHeight: '1.5', margin: '0 0 6px' };
export const linkFallback = {
  color: '#52525b',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: 0,
  wordBreak: 'break-all' as const,
};
export const buttonStyle = {
  backgroundColor: '#18181b',
  borderRadius: '6px',
  color: '#fafafa',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  padding: '12px 20px',
  textDecoration: 'none',
};
export const linkFallbackBlock = (url: string) => /* shared fallback section — see below */ url;
