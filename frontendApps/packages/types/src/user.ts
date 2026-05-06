import { z } from 'zod';

export const USER_ROLES = {
  PASSENGER: 'PASSENGER',
  RESTAURANT_STAFF: 'RESTAURANT_STAFF',
  BUS_OPERATOR: 'BUS_OPERATOR',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const UserRoleSchema = z.enum([
  'PASSENGER',
  'RESTAURANT_STAFF',
  'BUS_OPERATOR',
  'ADMIN',
]);

export const GENDERS = {
  MALE: 'M',
  FEMALE: 'F',
  OTHER: 'O',
  UNSET: '',
} as const;

export type Gender = (typeof GENDERS)[keyof typeof GENDERS];

export const GenderSchema = z.enum(['M', 'F', 'O', '']);

export const ORG_TYPES = {
  RESTAURANT: 'restaurant',
  OPERATOR: 'operator',
} as const;

export type OrgType = (typeof ORG_TYPES)[keyof typeof ORG_TYPES];

export const OrgTypeSchema = z.enum(['restaurant', 'operator']);

export const MembershipSchema = z.object({
  id: z.number(),
  org_type: OrgTypeSchema,
  org_id: z.number(),
  org_name: z.string(),
  org_role: z.string(),
  is_active: z.boolean(),
});

export type Membership = z.infer<typeof MembershipSchema>;

export const UserSchema = z.object({
  id: z.string(),
  phone_number: z.string(),
  full_name: z.string(),
  email: z.string().nullable(),
  gender: GenderSchema,
  role: UserRoleSchema,
  fcm_token: z.string().optional(),
  is_active: z.boolean(),
  is_staff: z.boolean().optional(),
  memberships: z.array(MembershipSchema).optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const TokensSchema = z.object({
  access: z.string(),
  refresh: z.string(),
});

export type Tokens = z.infer<typeof TokensSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  tokens: TokensSchema,
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
