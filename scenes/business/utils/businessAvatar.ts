// The single letter shown in place of a business's avatar photo when
// `avatarUrl` is null - there's no generic "no logo" illustration asset in
// this project (every existing image is a specific brand logo or person),
// so BusinessAvatar falls back to an initial instead of a placeholder photo.
export function getBusinessInitial(businessName: string): string {
  const trimmed = businessName.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}
