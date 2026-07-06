import { request } from '@playwright/test';

(async () => {
  const ctx = await request.newContext({ baseURL: 'http://localhost:5173' });
  const r = await ctx.get('http://localhost:4566/_aws/ses');
  console.log('absolute-with-baseURL:', r.status(), r.url());
  console.log('body head:', (await r.text()).slice(0, 120));
  await ctx.dispose();
})();
