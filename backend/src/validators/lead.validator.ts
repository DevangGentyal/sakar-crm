import { body, query } from 'express-validator';

const VALID_SOURCES = [
  'WEBSITE', 'FACEBOOK', 'INSTAGRAM', 'WHATSAPP',
  'GOOGLE', 'REFERRAL', 'WALK_IN', 'OTHER',
];

const VALID_STATUSES = [
  'NEW', 'CONTACTED', 'FOLLOW_UP',
  'INTERESTED', 'SITE_VISIT', 'NEGOTIATION', 'BOOKED', 'LOST',
];

export const createLeadValidator = [
  body('customer_name')
    .trim()
    .notEmpty().withMessage('Customer name is required')
    .isLength({ min: 3, max: 150 }).withMessage('Customer name must be 3-150 characters'),

  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile is required')
    .matches(/^\d{10}$/).withMessage('Mobile must be exactly 10 digits'),

  body('alternate_mobile')
    .optional({ nullable: true })
    .trim()
    .matches(/^\d{10}$/).withMessage('Alternate mobile must be exactly 10 digits'),

  body('email')
    .optional({ nullable: true })
    .trim()
    .custom((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('city')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('City must be at most 100 characters'),

  body('occupation')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Occupation must be at most 100 characters'),

  body('budget')
    .optional({ nullable: true })
    .isFloat({ gt: 0 }).withMessage('Budget must be a positive number'),

  body('source')
    .notEmpty().withMessage('Source is required')
    .customSanitizer((value) => VALID_SOURCES.includes(value) ? value : 'OTHER')
    .isIn(VALID_SOURCES).withMessage(`Source must be one of: ${VALID_SOURCES.join(', ')}`),

  body('project_id')
    .optional({ nullable: true })
    .isUUID().withMessage('Project ID must be a valid UUID'),

  body('assigned_user_id')
    .optional({ nullable: true })
    .isUUID().withMessage('Assigned user ID must be a valid UUID'),

  body('remarks')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Remarks must be at most 5000 characters'),

  body('next_followup_date')
    .optional({ nullable: true })
    .isISO8601().withMessage('next_followup_date must be a valid ISO 8601 datetime'),
];

export const updateLeadValidator = [
  body('customer_name').optional().trim().isLength({ min: 3, max: 150 }).withMessage('Customer name must be 3-150 characters'),
  body('mobile').optional().trim().matches(/^\d{10}$/).withMessage('Mobile must be exactly 10 digits'),
  body('alternate_mobile').optional({ nullable: true }).trim().matches(/^\d{10}$/).withMessage('Alternate mobile must be exactly 10 digits'),
  body('email').optional({ nullable: true }).trim().custom((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)).withMessage('Must be a valid email address').normalizeEmail(),
  body('city').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('City must be at most 100 characters'),
  body('occupation').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Occupation must be at most 100 characters'),
  body('source').optional().customSanitizer((value) => VALID_SOURCES.includes(value) ? value : 'OTHER').isIn(VALID_SOURCES).withMessage(`Source must be one of: ${VALID_SOURCES.join(', ')}`),
  body('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),

  body('remarks')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 5000 }).withMessage('Remarks must be at most 5000 characters'),

  body('assigned_user_id')
    .optional({ nullable: true })
    .custom((val) => val === null || typeof val === 'string')
    .withMessage('assigned_user_id must be a UUID or null')
    .custom((val) => val === null || /^[0-9a-f-]{36}$/i.test(val))
    .withMessage('assigned_user_id must be a valid UUID or null'),

  body('budget')
    .optional({ nullable: true })
    .isFloat({ gt: 0 }).withMessage('Budget must be a positive number'),

  body('next_followup_date')
    .optional({ nullable: true })
    .custom((val) => val === null || !isNaN(Date.parse(val)))
    .withMessage('next_followup_date must be a valid ISO 8601 datetime or null'),
];

export const listLeadsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100')
    .toInt(),

  query('status')
    .optional()
    .isIn(VALID_STATUSES).withMessage(`status filter must be one of: ${VALID_STATUSES.join(', ')}`),

  query('source')
    .optional()
    .isIn(VALID_SOURCES).withMessage(`source filter must be one of: ${VALID_SOURCES.join(', ')}`),

  query('project_id')
    .optional()
    .isUUID().withMessage('project_id filter must be a valid UUID'),

  query('assigned_user_id')
    .optional()
    .isUUID().withMessage('assigned_user_id filter must be a valid UUID'),

  query('sortBy')
    .optional()
    .isIn(['created_at', 'customer_name', 'status', 'next_followup_date', 'budget'])
    .withMessage('sortBy must be one of: created_at, customer_name, status, next_followup_date, budget'),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC']).withMessage('sortOrder must be ASC or DESC'),
];
