export { testimonialRoutes } from './server/routes';
export { testimonialInputSchema, testimonialSchema, updateTestimonialInputSchema } from './contract';
export type {
  Testimonial,
  TestimonialError,
  TestimonialInput,
  TestimonialListResponse,
  TestimonialMutationResponse,
  TestimonialSuccess,
  UpdateTestimonialInput,
} from './contract';
