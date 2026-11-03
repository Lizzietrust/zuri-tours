const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const PHOTO_PATH = "/img/users";

export const getInitials = (name?: string, email?: string): string => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (email?.trim().charAt(0) || "?").toUpperCase();
};

export const getPhotoUrl = (photo?: string | null): string | null => {
  if (!photo || photo === "default.jpg") return null;
  if (/^https?:\/\//i.test(photo)) return photo;
  if (photo.startsWith("/")) return `${API_URL}${photo}`;
  return `${API_URL}${PHOTO_PATH}/${photo}`;
};
