import { Hono } from 'hono';
import { listTestimonials } from './repository';

export const testimonialRoutes = new Hono().get('/', (context) => {
  const testimonials = listTestimonials();
  return context.json({ success: true as const, message: 'Testimonials retrieved', data: { testimonials } });
});
