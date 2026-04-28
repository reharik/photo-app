# @packages/notifications

Stateless notification library: transactional email today (via [Resend](https://resend.com)), with a channel abstraction so SMS can be added later. No database and no HTTP server—import `notify()` from your app (for example the API worker) and call it when something happens.

## Install

From the monorepo root:

```bash
npm install
```

Add the workspace package to the app that will send mail:

```bash
npm install @packages/notifications --workspace=@app/api
```

(Use your app’s workspace name instead of `@app/api` if different.)

### Build & lint (Nx)

```bash
nx build notifications
nx lint notifications
nx test notifications
```

### TypeScript path alias (optional)

To match `import { notify } from '@/notifications'`, map the package in that app’s `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/notifications": ["../../packages/context/notifications/index.ts"],
      "@/notifications/*": ["../../packages/context/notifications/*"]
    }
  }
}
```

Adjust the relative path from your app to `packages/context/notifications`. Alternatively, import by package name only:

```typescript
import { notify } from '@packages/notifications';
```

## Environment variables

| Variable         | Required | Description                                       |
| ---------------- | -------- | ------------------------------------------------- |
| `RESEND_API_KEY` | Yes\*    | Resend API key                                    |
| `FROM_EMAIL`     | Yes\*    | Sender address (e.g. `notifications@yourapp.com`) |
| `FROM_NAME`      | No       | Display name (e.g. `PhotoApp`)                    |

\*If missing, `notify()` returns `{ success: false, error: ... }` and does not throw.

## Usage

```typescript
import { notify } from '@packages/notifications';

// Single recipient as email string (email channel implied)
const result = await notify({
  to: 'user@example.com',
  template: 'share-invite',
  data: {
    inviterName: 'Alice',
    resourceName: 'Q3 Report',
    inviteUrl: 'https://example.com/invite/abc',
  },
});

if (result.success) {
  console.log('Sent:', result.id);
} else {
  console.error(result.error);
}
```

Future-friendly multi-channel payload:

```typescript
await notify({
  to: { email: 'user@example.com', phone: '+15551234567' },
  channels: ['email'], // later: ['email', 'sms']
  template: 'share-invite',
  data: {
    inviterName: 'Alice',
    resourceName: 'Q3 Report',
    inviteUrl: 'https://example.com/invite/abc',
  },
});
```

`template` and `data` are typed together: for `template: 'welcome'`, `data` must match the welcome template fields.

### Return value

- `{ success: true, id: string }` — provider message id (multiple channels join ids with `|`)
- `{ success: false, error: string }` — never throws; failures are also logged with template name, recipient, and provider details where available

## Adding a new template (4 steps)

1. **Extend the template union and data shape** in `types.ts`: add the new name to `TemplateName` and a matching entry on `TemplateData`.
2. **Create** `templates/your-template.tsx`: default export a React Email component; export a named `subject` function `(data) => string` using the same data type as in `TemplateData`.
3. **Register** it in `templates/index.ts`: import the component and `subject`, add a row to `templateRegistry` so `TemplateRegistry` still covers every `TemplateName` (TypeScript will error if you skip one or mismatch props).
4. **Rebuild** the package: `nx build notifications` (or `npm run build --workspace=@packages/notifications`).

## Layout

- `index.ts` — public exports (`notify` + types)
- `client.ts` — Resend client (swap provider by changing `channels/email.ts` + `client.ts`)
- `send.ts` — `notify()` orchestration
- `types.ts` — payload and template typing
- `templates/` — React Email templates and registry
- `channels/email.ts` — email send
- `channels/sms.ts` — SMS stub (`NotImplementedError` + TODO for Twilio, etc.)
