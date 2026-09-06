import { AuditRecord } from '../Entity';

export const stampAudit = <T extends AuditRecord & { id?: string }>(
  row: T,
  viewerId: string,
): T & AuditRecord => {
  const now = new Date();
  const result = {
    ...row,
    updatedAt: now,
    updatedBy: viewerId,
  };

  if (!row.id) {
    return {
      ...result,
      createdAt: now,
      createdBy: viewerId,
    };
  }

  return result;
};
