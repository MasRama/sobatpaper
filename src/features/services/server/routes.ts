import { Hono } from 'hono';
import type { ServiceDetail, ServiceSummary } from '../contract';
import { findServiceBySlug, listServiceFaqs, listServices, type ServiceRow } from './repository';

function toSummary(row: ServiceRow): ServiceSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    startingPrice: row.starting_price,
    estimatedTime: row.estimated_time,
  };
}

function toDetail(row: ServiceRow): ServiceDetail {
  const faqs = listServiceFaqs(row.id).map((faq) => ({ question: faq.question, answer: faq.answer }));
  return {
    ...toSummary(row),
    description: row.description,
    scope: row.scope,
    process: row.process,
    disclaimer: row.disclaimer,
    faqs,
  };
}

export const servicesRoutes = new Hono()
  .get('/', (context) => {
    const services = listServices().map(toSummary);
    return context.json({ success: true as const, message: 'Services retrieved', data: { services } });
  })
  .get('/:slug', (context) => {
    const service = findServiceBySlug(context.req.param('slug'));
    if (!service) {
      return context.json({ success: false as const, message: 'Service not found', code: 'NOT_FOUND' }, 404);
    }
    return context.json({ success: true as const, message: 'Service retrieved', data: { service: toDetail(service) } });
  });
