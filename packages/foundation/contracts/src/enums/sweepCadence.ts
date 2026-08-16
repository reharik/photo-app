import { enumeration, Enumeration } from '@reharik/smart-enum';

// Two members only, by design: each cadence is backed by its own interval gate
// (fastSweepIntervalMS / slowSweepIntervalMS). A third member means a third gate —
// add them together.
const cadenceInput = ['fast', 'slow'] as const;
export type SweepCadence = Enumeration<typeof SweepCadence>;
export const SweepCadence = enumeration<typeof cadenceInput>('SweepCadence', {
  input: cadenceInput,
});
