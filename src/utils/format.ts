import type { BusinessType } from "../types/business";

const businessLabels: Record<BusinessType, string> = {
  GYM: "Gym",
  TUTION: "Tuition",
  SWIMMING_CLASS: "Swimming class",
  RENT: "Rental",
  OTHER: "Other",
};

export function formatBusinessType(type: BusinessType) {
  return businessLabels[type];
}

export function formatDate(value?: string) {
  if (!value) return "Recently";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function getInitials(value: string) {
  return value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
