import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase } from '../../../shared/database';
import { run as seedContent } from '../server/seeds/202609260003_content';

describe('content routes', () => {
  beforeEach(() => {
    seedContent(getDatabase());
  });

  it('serves a content page by slug', async () => {
    const response = await app.request('/api/content/pages/tentang-kami');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { page: { slug: 'tentang-kami', title: 'Tentang Kami' } },
    });
  });

  it('returns 404 for an unknown page slug', async () => {
    const response = await app.request('/api/content/pages/halaman-aneh');

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ success: false, code: 'NOT_FOUND' });
  });

  it('lists faqs with optional category filter', async () => {
    const all = await app.request('/api/content/faqs');
    const allPayload = (await all.json()) as { data: { faqs: Array<{ question: string }> } };
    expect(allPayload.data.faqs.length).toBeGreaterThanOrEqual(10);

    const filtered = await app.request('/api/content/faqs?category=umum');
    const filteredPayload = (await filtered.json()) as { data: { faqs: Array<{ category: string }> } };
    expect(filteredPayload.data.faqs.length).toBeGreaterThan(0);
    expect(filteredPayload.data.faqs.every((faq) => faq.category === 'umum')).toBe(true);

    const empty = await app.request('/api/content/faqs?category=kategori-aneh');
    const emptyPayload = (await empty.json()) as { data: { faqs: unknown[] } };
    expect(emptyPayload.data.faqs).toEqual([]);
  });
});
