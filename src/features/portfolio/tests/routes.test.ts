import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase } from '../../../shared/database';
import { run as seedPortfolio } from '../server/seeds/202609260004_portfolio';

describe('portfolio routes', () => {
  beforeEach(() => {
    seedPortfolio(getDatabase());
  });

  it('lists portfolio items publicly', async () => {
    const response = await app.request('/api/portfolio');

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { data: { items: Array<{ category: string }> } };
    expect(payload.data.items.length).toBeGreaterThanOrEqual(6);
  });

  it('filters items by category', async () => {
    const response = await app.request('/api/portfolio?category=Artikel');

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { data: { items: Array<{ category: string }> } };
    expect(payload.data.items.length).toBeGreaterThan(0);
    expect(payload.data.items.every((item) => item.category === 'Artikel')).toBe(true);
  });
});
