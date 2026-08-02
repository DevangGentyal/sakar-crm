import { body } from 'express-validator';

export const followupValidator = [
  body('followup_date').notEmpty().isISO8601().withMessage('followup_date must be a valid ISO 8601 datetime'),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 5000 }).withMessage('notes must be at most 5000 characters'),
  body('status').optional({ nullable: true }).isIn(['NEW', 'CONTACTED', 'FOLLOW_UP', 'INTERESTED', 'SITE_VISIT', 'NEGOTIATION', 'BOOKED', 'LOST']).withMessage('Invalid follow-up status'),
];
