import { describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { csrfHeaders, issueCsrf } from '../../../shared/security/tests/helpers';
import type { QuoteInput } from '../contract';
import { quoteEstimation } from '../server/quote';

const BASE_INPUT: QuoteInput = {
  educationLevel: 'S1',
  serviceSlug: 'skripsi',
  field: 'Manajemen',
  method: 'kuantitatif',
  pages: 0,
  dataCount: 0,
  journalTarget: null,
  deadline: '2030-06-01',
};

async function postQuote(input: unknown): Promise<Response> {
  const csrf = await issueCsrf(app);
  return app.request('/api/estimation/quote', {
    method: 'POST',
    headers: { ...csrfHeaders(csrf), 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

describe('estimation quote', () => {
  it('returns a deterministic range for identical input', async () => {
    const first = await postQuote(BASE_INPUT);
    const second = await postQuote(BASE_INPUT);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstBody = (await first.json()) as unknown;
    const secondBody = (await second.json()) as unknown;
    expect(firstBody).toEqual(secondBody);
    expect(firstBody).toMatchObject({
      success: true,
      data: { min: 2700000, max: 3900000, currency: 'IDR' },
    });
  });

  it('prices journal tiers from the target', async () => {
    const response = await postQuote({
      ...BASE_INPUT,
      serviceSlug: 'artikel-ilmiah',
      educationLevel: 'S2',
      journalTarget: 'SINTA 3',
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { min: 4500000, max: 6500000 },
    });
  });

  it('requires a journal target for journal services', async () => {
    const response = await postQuote({ ...BASE_INPUT, serviceSlug: 'konversi-jurnal', journalTarget: null });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: 'VALIDATION_ERROR',
      errors: { journalTarget: expect.any(Array) },
    });
  });

  it('rejects malformed input with field diagnostics', async () => {
    const response = await postQuote({ ...BASE_INPUT, pages: -3, deadline: 'kemarin' });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      code: 'VALIDATION_ERROR',
      errors: { pages: expect.any(Array), deadline: expect.any(Array) },
    });
  });

  it('applies rush, method, and volume adjustments deterministically', () => {
    const now = new Date('2026-09-01T00:00:00Z');
    const relaxed = quoteEstimation({ ...BASE_INPUT, serviceSlug: 'analisis-data', deadline: '2026-10-01' }, now);
    expect(relaxed).toMatchObject({ min: 450000, max: 650000 });

    const rushed = quoteEstimation(
      { ...BASE_INPUT, serviceSlug: 'analisis-data', method: 'sem-pls', dataCount: 600, deadline: '2026-09-05' },
      now,
    );
    // 500k base + 500k SEM/PLS + 300k data = 1.3jt, +25% rush = 1.625jt
    expect(rushed.min).toBe(1450000);
    expect(rushed.max).toBe(2100000);
    expect(rushed.factors.length).toBeGreaterThan(1);
  });
});
