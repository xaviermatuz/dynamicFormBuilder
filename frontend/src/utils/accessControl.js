export const canAccess = (requiredRoles, userRoles = []) => {
    if (!requiredRoles) return true;
    return requiredRoles.some((role) => userRoles.includes(role));
};
