
/**
 * Normalizes a role string for comparison
 */
export const normalizeRole = (role: string = ''): string => {
  return role.toLowerCase().replace(/[\s_-]+/g, '_');
};

/**
 * Checks if a role is a platform administrator role
 */
export const isPlatformAdmin = (role: string = ''): boolean => {
  const normalized = normalizeRole(role);
  return normalized === 'platform_admin' || normalized === 'super_admin';
};

/**
 * Gets the correct dashboard redirection path based on user role
 */
export const getDashboardRedirect = (user: any): string => {
  if (!user || !user.role) return '/login';

  if (isPlatformAdmin(user.role)) {
    return '/platform-admin/dashboard';
  }

  const roleSlug = user.role.toLowerCase().replace(/[\s_]+/g, '-');
  const slug = user.hospital_slug;

  if (slug) {
    return `/${slug}/${roleSlug}/dashboard`;
  }

  return `/${roleSlug}/dashboard`;
};
