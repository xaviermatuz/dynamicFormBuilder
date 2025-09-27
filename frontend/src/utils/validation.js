export const validateField = (name, value, context = {}) => {
    if (!value || !value.toString().trim()) {
        return `${name.replace(/^\w/, (c) => c.toUpperCase())} is required.`;
    }

    if (name === "password2" && value !== context.password) {
        return "Passwords do not match.";
    }

    return "";
};
