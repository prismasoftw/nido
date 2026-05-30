// Hand-maintained mirror of the Supabase schema (supabase/migrations).
// Regenerate with: supabase gen types typescript --linked > src/lib/supabase/types.ts
// once a project is linked.

export type MemberRole = "owner" | "admin" | "manager" | "reception";
export type MemberStatus = "active" | "inactive" | "suspended" | "invited";
export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";
export type PlanCode = "free" | "lite" | "premium";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "paused";
export type ResourceKind =
  | "private_office"
  | "dedicated_desk"
  | "hot_desk"
  | "meeting_room"
  | "event_space"
  | "locker";
export type PriceUnit = "hour" | "day" | "week" | "month";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";
export type PaymentProvider = "mercadopago" | "cash" | "transfer" | "other";
export type PaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "refunded"
  | "cancelled"
  | "in_process";
export type InvoiceStatus = "draft" | "issued" | "paid" | "void";
export type CheckinMethod = "qr" | "manual" | "kiosk";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamps = { created_at: string; updated_at: string };

export type PlanLimits = {
  locations: number;
  resources: number;
  members: number;
  staff: number;
  bookings_per_month: number;
}

export type PlanFeatures = {
  online_payments: boolean;
  public_portal: boolean;
  qr_checkin: boolean;
  email_notifications: boolean;
  recurring_bookings: boolean;
  advanced_analytics: boolean;
  custom_branding: boolean;
  multi_location: boolean;
  api_access: boolean;
  priority_support: boolean;
}

export type Profile = Timestamps & {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

export type Organization = Timestamps & {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  timezone: string;
  currency: string;
  country: string;
  plan: PlanCode;
  trial_ends_at: string | null;
  mp_customer_id: string | null;
  settings: Json;
  created_by: string | null;
}

export type OrganizationMember = {
  org_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  created_at: string;
}

export type Invitation = {
  id: string;
  org_id: string;
  email: string;
  role: MemberRole;
  status: InvitationStatus;
  token: string;
  invited_by: string | null;
  expires_at: string;
  created_at: string;
}

export type Plan = Timestamps & {
  code: PlanCode;
  name: string;
  description: string | null;
  price_mxn: number;
  sort_order: number;
  is_public: boolean;
  limits: PlanLimits;
  features: PlanFeatures;
}

export type Subscription = Timestamps & {
  id: string;
  org_id: string;
  plan_code: PlanCode;
  status: SubscriptionStatus;
  mp_subscription_id: string | null;
  mp_payer_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export type Location = Timestamps & {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  city: string | null;
  timezone: string;
  opening_hours: Json;
  is_active: boolean;
}

export type Resource = Timestamps & {
  id: string;
  org_id: string;
  location_id: string;
  name: string;
  kind: ResourceKind;
  description: string | null;
  capacity: number;
  price_hour: number | null;
  price_day: number | null;
  price_week: number | null;
  price_month: number | null;
  currency: string;
  min_minutes: number;
  max_minutes: number | null;
  buffer_minutes: number;
  requires_approval: boolean;
  amenities: Json;
  photos: Json;
  is_active: boolean;
}

export type MembershipPlan = Timestamps & {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_unit: PriceUnit;
  included_hours: number | null;
  is_active: boolean;
}

export type Member = Timestamps & {
  id: string;
  org_id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: MemberStatus;
  membership_plan_id: string | null;
  credit_minutes: number;
  notes: string | null;
  mp_customer_id: string | null;
}

export type Booking = Timestamps & {
  id: string;
  org_id: string;
  location_id: string;
  resource_id: string;
  member_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  price: number;
  currency: string;
  title: string | null;
  notes: string | null;
  source: string;
  created_by: string | null;
  cancelled_at: string | null;
}

export type Payment = Timestamps & {
  id: string;
  org_id: string;
  member_id: string | null;
  booking_id: string | null;
  kind: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  provider_preference_id: string | null;
  metadata: Json;
  paid_at: string | null;
}

export type Invoice = Timestamps & {
  id: string;
  org_id: string;
  member_id: string | null;
  payment_id: string | null;
  number: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  items: Json;
  issued_at: string;
  due_at: string | null;
  pdf_url: string | null;
}

export type CheckIn = {
  id: string;
  org_id: string;
  booking_id: string | null;
  member_id: string | null;
  resource_id: string | null;
  method: CheckinMethod;
  checked_in_at: string;
  checked_out_at: string | null;
  created_at: string;
}

export type Notification = {
  id: string;
  org_id: string;
  user_id: string | null;
  member_id: string | null;
  type: string;
  title: string;
  body: string | null;
  payload: Json;
  read_at: string | null;
  created_at: string;
}

type Row<T> = T;

// Columns whose type admits null (including Json) are nullable/defaulted in the
// DB, so they are optional on insert. Callers pass `Optional` for the remaining
// non-null columns that still have a DB default.
type NullableKeys<T> = {
  [K in keyof T]-?: null extends T[K] ? K : never;
}[keyof T];

type Insert<T, Optional extends keyof T = never> = Omit<
  T,
  Optional | NullableKeys<T>
> &
  Partial<Pick<T, Optional | NullableKeys<T>>>;

type TableDef<R, I> = {
  Row: R;
  Insert: I;
  Update: Partial<I>;
  Relationships: [];
};

type AutoCols = "id" | "created_at" | "updated_at";

export type Database = {
  public: {
    Views: Record<string, never>;
    Tables: {
      profiles: TableDef<Profile, Insert<Profile, "created_at" | "updated_at">>;
      organizations: TableDef<
        Organization,
        Insert<
          Organization,
          | AutoCols
          | "logo_url"
          | "brand_color"
          | "timezone"
          | "currency"
          | "country"
          | "plan"
          | "trial_ends_at"
          | "mp_customer_id"
          | "settings"
          | "created_by"
        >
      >;
      organization_members: TableDef<
        OrganizationMember,
        Insert<OrganizationMember, "created_at">
      >;
      invitations: TableDef<Invitation, Insert<Invitation, "id" | "created_at" | "token">>;
      plans: TableDef<Plan, Insert<Plan, "created_at" | "updated_at">>;
      subscriptions: TableDef<Subscription, Insert<Subscription, AutoCols>>;
      locations: TableDef<
        Location,
        Insert<Location, AutoCols | "timezone" | "is_active">
      >;
      resources: TableDef<
        Resource,
        Insert<
          Resource,
          | AutoCols
          | "capacity"
          | "currency"
          | "min_minutes"
          | "buffer_minutes"
          | "requires_approval"
          | "is_active"
        >
      >;
      membership_plans: TableDef<MembershipPlan, Insert<MembershipPlan, AutoCols>>;
      members: TableDef<Member, Insert<Member, AutoCols>>;
      bookings: TableDef<Booking, Insert<Booking, AutoCols>>;
      payments: TableDef<Payment, Insert<Payment, AutoCols>>;
      invoices: TableDef<Invoice, Insert<Invoice, AutoCols>>;
      check_ins: TableDef<CheckIn, Insert<CheckIn, "id" | "created_at">>;
      notifications: TableDef<Notification, Insert<Notification, "id" | "created_at">>;
    };
    Functions: {
      is_resource_available: {
        Args: {
          p_resource: string;
          p_start: string;
          p_end: string;
          p_exclude?: string;
        };
        Returns: boolean;
      };
      resource_busy_ranges: {
        Args: { p_resource: string; p_from: string; p_to: string };
        Returns: { starts_at: string; ends_at: string }[];
      };
      org_usage: { Args: { p_org: string }; Returns: Json };
    };
  };
}
