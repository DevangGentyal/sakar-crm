import { PoolClient } from 'pg';

/**
 * Generates the next lead code for today based on existing records.
 * Format: SAKAR-YYYYMMDD-NNNN  (e.g. SAKAR-20260131-0001)
 */
export async function generateLeadCode(client: PoolClient): Promise<string> {
  const today = new Date();
  const dateKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('');

  const prefix = `SAKAR-${dateKey}-`;

  // Find the highest existing sequence number for today
  const result = await client.query<{ max_code: string | null }>(
    `SELECT MAX(lead_code) as max_code FROM leads WHERE lead_code LIKE $1`,
    [`${prefix}%`]
  );

  let seq = 1;
  if (result.rows[0]?.max_code) {
    const lastSeqStr = result.rows[0].max_code.replace(prefix, '');
    const lastSeq = parseInt(lastSeqStr, 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  const paddedSeq = String(seq).padStart(4, '0');
  return `${prefix}${paddedSeq}`;
}
