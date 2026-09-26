// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { seed } from '../shared/database';
import { app } from './server';

describe('sitemap and robots', () => {
  beforeEach(() => {
    seed();
  });

  it('lists static paths and seeded services', async () => {
    const response = await app.request('/sitemap.xml');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/xml');
    const body = await response.text();
    expect(body).toContain('/harga</loc>');
    expect(body).toContain('/layanan/skripsi</loc>');
    expect(body).toContain('/layanan/konversi-jurnal</loc>');
  });

  it('serves crawler rules with a sitemap reference', async () => {
    const response = await app.request('/robots.txt');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    const body = await response.text();
    expect(body).toContain('Disallow: /admin/');
    expect(body).toContain('Disallow: /api/');
    expect(body).toContain('/sitemap.xml');
  });
});
