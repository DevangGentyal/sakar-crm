import { env } from "../../config/env";

export function getPublicImageUrl(storedValue?: string | null): string | null {
  if (!storedValue) return null;

  if (storedValue.startsWith("http://") || storedValue.startsWith("https://")) {
    return storedValue;
  }

  if (env.STORAGE_PROVIDER === "s3") {
    return storedValue;
  }

  const normalizedAbsolute = storedValue.replaceAll("\\", "/");
  if (normalizedAbsolute.includes("backend/uploads/leads/")) {
    const idx = normalizedAbsolute.lastIndexOf("backend/uploads/leads/");
    return `${env.PUBLIC_BASE_URL}/uploads/leads/${normalizedAbsolute.slice(
      idx + "backend/uploads/leads/".length,
    )}`;
  }

  if (storedValue.startsWith("/uploads/")) {
    return `${env.PUBLIC_BASE_URL}${storedValue}`;
  }

  if (storedValue.startsWith("uploads/")) {
    return `${env.PUBLIC_BASE_URL}/${storedValue}`;
  }

  return `${env.PUBLIC_BASE_URL}${storedValue.startsWith("/") ? "" : "/"}${storedValue}`;
}
