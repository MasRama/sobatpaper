import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase } from '../../../shared/database';
import { run as seedServices } from '../server/seeds/202609260001_services';

describe('services routes', () => {
  beforeEach(() => {
    seedServices(getDatabase());
  });

  it('lists all services ordered with summaries', async () => {
    const response = await app.request('/api/services');

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      success: boolean;
      data: { services: Array<{ slug: string; name: string; startingPrice: number }> };
    };
    expect(payload.success).toBe(true);
    expect(payload.data.services.map((service) => service.slug)).toEqual([
      'skripsi',
      'tesis',
      'analisis-data',
      'editing-formatting',
      'konversi-jurnal',
      'artikel-ilmiah',
    ]);
    expect(payload.data.services[0]).toMatchObject({ name: 'Pendampingan Skripsi', startingPrice: 3000000 });
  });

  it('returns full detail with scope, process, and faqs', async () => {
    const response = await app.request('/api/services/analisis-data');

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      success: boolean;
      data: { service: { slug: string; scope: string[]; process: string[]; faqs: Array<{ question: string }> } };
    };
    expect(payload.data.service.slug).toBe('analisis-data');
    expect(payload.data.service.scope.length).toBeGreaterThan(0);
    expect(payload.data.service.process.length).toBeGreaterThan(0);
    expect(payload.data.service.faqs.length).toBeGreaterThan(0);
  });

  it('returns 404 for an unknown service slug', async () => {
    const response = await app.request('/api/services/tesis-abal-abal');

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ success: false, code: 'NOT_FOUND' });
  });
});
