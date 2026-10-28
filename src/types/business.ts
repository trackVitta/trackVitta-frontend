export type BusinessType =
  | "GYM"
  | "TUTION"
  | "SWIMMING_CLASS"
  | "RENT"
  | "OTHER";

export interface Business {
  businessId: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  businessDesc: string;
  createdAt: string;
}

export interface CreateBusinessRequest {
  name: string;
  desc: string;
  businessType: BusinessType;
}
