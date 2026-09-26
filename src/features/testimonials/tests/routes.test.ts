import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../../app/server';
import { getDatabase } from '../../../shared/database';
import { run as seedTestimonials } from '../server/seeds/202609260005_testimonials';

describe('testimonial routes', () => {
  beforeEach(() => {
    seedTestimonials(getDatabase());
  });

  it('lists testimonials publicly', async () => {
    const response = await app.request('/api/testimonials');

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      data: { testimonials: Array<{ displayName: string; role: string; content: string }> };
    };
    expect(payload.data.testimonials.length).toBeGreaterThanOrEqual(4);
    expect(payload.data.testimonials[0]).toMatchObject({ displayName: 'A***', role: 'Mahasiswa S2' });
  });
});
