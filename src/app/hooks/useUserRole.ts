import { useUserStore } from '../utils/store/userStore';
import { RoleEnum } from '../types/dto';

/**
 * Hook for accessing user role information
 * Provides easy access to role checks and permissions
 */
export const useUserRole = () => {
  const { 
    getRole, 
    isAdmin, 
    isModerator, 
    isUser, 
    hasAdminAccess 
  } = useUserStore();

  return {
    // Current role
    role: getRole(),
    
    // Role checks
    isAdmin: isAdmin(),
    isModerator: isModerator(),
    isUser: isUser(),
    hasAdminAccess: hasAdminAccess(),
    
    // Helper functions
    hasRole: (role: RoleEnum) => getRole() === role,
    hasAnyRole: (roles: RoleEnum[]) => {
      const currentRole = getRole();
      return currentRole ? roles.includes(currentRole) : false;
    },
  };
};

/**
 * Hook for role-based conditional rendering
 * Returns true if user has required role
 */
export const useRequireRole = (requiredRole: RoleEnum | RoleEnum[]): boolean => {
  const { hasRole, hasAnyRole } = useUserRole();
  
  if (Array.isArray(requiredRole)) {
    return hasAnyRole(requiredRole);
  }
  
  return hasRole(requiredRole);
};

/**
 * Hook for admin access check
 * Returns true if user is ADMIN or MODERATOR
 */
export const useRequireAdminAccess = (): boolean => {
  const { hasAdminAccess } = useUserRole();
  return hasAdminAccess;
};











