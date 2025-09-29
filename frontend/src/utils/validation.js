// Friendly label map
const fieldLabels = {
    first_name: "First Name",
    last_name: "Last Name",
    username: "Username",
    email: "Email",
    password: "Password",
    password2: "Confirm Password",
};

// Formatter: use mapping first, then fallback to clean-up
const formatLabel = (name) => {
    if (fieldLabels[name]) return fieldLabels[name];
    return name
        .replace(/_/g, " ") // replace underscores with spaces
        .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize words
};

export const validateField = (name, value, context = {}) => {
    if (!value || !value.toString().trim()) {
        return `${formatLabel(name)} is required.`;
    }

    if (name === "password2" && value !== context.password) {
        return "Passwords do not match.";
    }

    return "";
};
