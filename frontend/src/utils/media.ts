const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function getApiOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:4000";
  }
}

export function resolveLeadPhotoUrl(photoUrl?: string | null): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl.replace(/\/api\/?$/, "");
  }
  if (photoUrl.startsWith("/uploads/")) {
    return `${getApiOrigin()}${photoUrl}`;
  }
  if (photoUrl.startsWith("uploads/")) {
    return `${getApiOrigin()}/${photoUrl}`;
  }
  return photoUrl;
}
