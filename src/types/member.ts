export type MembershipPlan =
  | "MONTHLY"
  | "DAILY"
  | "WEEKLY"
  | "QUARTERLY"
  | "HOURLY"
  | "HALF_YEARLY"
  | "ANNUALLY"
  | "OTHERS";

export interface Member {
  member_id: string;
  member_name: string;
  businessId: string;
  created_at: string;
}

export interface CreateMemberRequest {
  businessId: string;
  ownerId: string;
  fullName: string;
  email?: string;
  memberId_ofBusiness?: string;
  membershipPlan: MembershipPlan;
  membership_fee: number;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  membership_start?: string;
  membership_end?: string;
  status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}
