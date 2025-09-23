// parseApiError.js
export const parseApiError = (message) => {
    if (!message) return ["Unknown error"];

    const parts = message.split(/\d+:\s/).filter(Boolean);
    const allMessages = [];

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");

    parts.forEach((part, index) => {
        try {
            const obj = JSON.parse(part);

            const processObject = (obj, prefix = "") => {
                Object.entries(obj).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach((v) => allMessages.push(`Item ${index}: ${capitalize(key)} ${v}`));
                    } else if (typeof value === "object" && value !== null) {
                        // Flatten nested objects
                        Object.entries(value).forEach(([subKey, subValue]) => {
                            if (Array.isArray(subValue)) {
                                subValue.forEach((v) => allMessages.push(`Item ${index}: ${capitalize(subKey)} ${v}`));
                            }
                        });
                    }
                });
            };

            processObject(obj);
        } catch (err) {
            allMessages.push(`Item ${index}: ${part}`);
        }
    });

    return allMessages; // array of clean text messages
};
