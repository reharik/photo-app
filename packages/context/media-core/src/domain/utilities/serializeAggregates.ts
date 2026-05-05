import { isSmartEnumItem } from '@reharik/smart-enum';

import { Entity } from '../Entity';
import { isEntity } from './entityGuard';

export const serializeValue = (value: unknown): unknown => {
  if (value == null) return value;

  if (typeof value === 'bigint') return value.toString();

  // primitives
  if (typeof value !== 'object') return value;

  // special cases FIRST
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (isEntity(value)) return value.toPersistence();

  console.log('[serialize-debug]', {
    type: typeof value,
    isSmartEnum: isSmartEnumItem(value),
    isEntity: isEntity(value),
    hasBrand: (value as any)?.__smart_enum_brand,
    ownProps:
      typeof value === 'object' && value !== null ? Object.getOwnPropertyNames(value) : null,
  });
  console.log('[serialize-debug] symbols:', {
    ownSymbols: Object.getOwnPropertySymbols(value),
    symbolsAsStrings: Object.getOwnPropertySymbols(value).map((s) => s.toString()),
  });
  if (isSmartEnumItem(value)) {
    return value.value;
  }

  // plain objects LAST
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, serializeValue(nested)]),
  );
};

export const serializeEntity = <TRecord extends Record<string, unknown>, E extends Entity<TRecord>>(
  entity: E,
): TRecord => serializeValue(entity.persistenceState()) as TRecord;
