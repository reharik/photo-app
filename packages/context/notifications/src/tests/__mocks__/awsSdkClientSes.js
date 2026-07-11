// Static mock for `@aws-sdk/client-ses`, wired via moduleNameMapper so it applies
// uniformly to every file in the unit run. Per-file `jest.unstable_mockModule` for
// this package was unreliable: other suites transitively load the REAL emailClient
// (and thus the real SES client) into the worker first, after which the ESM mock no
// longer wins — the code then hit real LocalStack SES and flaked under load
// (RAI-76). A config-level mock is never shadowed by a real import.
//
// Tests control the outcome with `__setSesSend(fn)` and reset with `__resetSesSend()`.
let currentSend = async () => ({ MessageId: 'mock-message-id' });

export const __setSesSend = (fn) => {
  currentSend = fn;
};

export const __resetSesSend = () => {
  currentSend = async () => ({ MessageId: 'mock-message-id' });
};

export class SESClient {
  send(command) {
    return currentSend(command);
  }
}

export class SendRawEmailCommand {
  constructor(input) {
    this.input = input;
  }
}
