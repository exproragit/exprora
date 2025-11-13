/**
 * Zod validation schemas for all API endpoints
 */
import { z } from 'zod';

// Common schemas
export const emailSchema = z.string().email('Invalid email format');
export const urlSchema = z.string().url('Invalid URL format');
export const positiveIntSchema = z.number().int().positive();
export const nonNegativeIntSchema = z.number().int().min(0);

// Auth schemas
export const signupSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(255),
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  domain: z.string().url().optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Experiment schemas
export const createExperimentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  type: z.enum(['ab_test', 'multivariate', 'split_url']),
  traffic_allocation: z.number().int().min(1).max(100).optional(),
  primary_goal: z.string().optional(),
  secondary_goals: z.any().optional(),
  targeting_rules: z.any().optional(),
  start_date: z.string().datetime().optional().or(z.null()),
  end_date: z.string().datetime().optional().or(z.null()),
});

export const updateExperimentSchema = createExperimentSchema.partial();

export const createVariantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['control', 'variant']),
  traffic_percentage: z.number().int().min(0).max(100).optional(),
  changes: z.any().optional(),
  custom_code: z.string().optional(), // Keep for backward compatibility
  css_code: z.string().optional(),
  js_code: z.string().optional(),
  is_control: z.boolean().optional(),
});

export const updateVariantSchema = createVariantSchema.partial();

// Heatmap schemas
export const heatmapTrackSchema = z.object({
  page_url: urlSchema,
  x_coordinate: z.number().int().min(0).max(100000),
  y_coordinate: z.number().int().min(0).max(100000),
  scroll_depth: z.number().int().min(0).max(100).optional(),
  element_selector: z.string().max(1000).optional(),
  experiment_id: positiveIntSchema.optional(),
  event_type: z.enum(['click', 'scroll', 'move']),
});

export const heatmapQuerySchema = z.object({
  page_url: urlSchema.optional(),
  experiment_id: z.string().transform((val) => parseInt(val)).pipe(positiveIntSchema).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

// Recording schemas
export const recordingSaveSchema = z.object({
  visitor_id: z.string().min(1, 'Visitor ID is required'),
  session_id: z.string().min(1, 'Session ID is required'),
  page_url: urlSchema,
  recording_data: z.any(), // JSONB data
  duration: positiveIntSchema.optional(),
  page_views: positiveIntSchema.optional(),
});

// API/SDK schemas
export const visitorInitSchema = z.object({
  visitor_id: z.string().min(1, 'Visitor ID is required'),
  session_id: z.string().optional(),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
});

export const trackEventSchema = z.object({
  visitor_id: z.string().min(1, 'Visitor ID is required'),
  experiment_id: positiveIntSchema.optional(),
  variant_id: positiveIntSchema.optional(),
  event_type: z.string().min(1, 'Event type is required'),
  event_name: z.string().optional(),
  event_value: z.number().optional(),
  url: urlSchema.optional(),
  metadata: z.any().optional(),
});

export const activeExperimentsQuerySchema = z.object({
  visitor_id: z.string().min(1, 'Visitor ID is required'),
  url: urlSchema.optional(),
});

// Profile update schema
export const updateProfileSchema = z.object({
  company_name: z.string().min(1).max(255).optional(),
  domain: z.string().url().optional().or(z.literal('')),
});

