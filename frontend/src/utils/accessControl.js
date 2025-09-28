export const canAccess = (requiredRoles, userRoles = []) => {
    if (!requiredRoles) return true;
    return requiredRoles.some((role) => userRoles.includes(role));
};

export function canCreate(user) {
    return ["admin", "editor"].some((r) => user?.roles?.includes(r));
}

export function canEdit(user, form) {
    return user?.roles?.includes("admin") || (user?.roles?.includes("editor") && !form.is_deleted);
}

export function canDelete(user) {
    return user?.roles?.includes("admin");
}
