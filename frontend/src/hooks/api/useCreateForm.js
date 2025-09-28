import { useState } from "react";

export function useCreateSchemaForm() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [fields, setFields] = useState([]);
    const [errors, setErrors] = useState({});

    const reset = () => {
        setName("");
        setDescription("");
        setFields([]);
        setErrors({});
    };

    const addField = () => {
        setFields((prev) => [...prev, { name: "", label: "", field_type: "text", required: false, order: prev.length + 1, options: [] }]);
    };

    const removeField = (index) => {
        setFields((prev) => prev.filter((_, i) => i !== index));
        setErrors((prev) => {
            const copy = { ...prev };
            delete copy[index];
            return copy;
        });
    };

    const updateField = (index, key, value, liveValidate = true) => {
        setFields((prev) => {
            const copy = [...prev];
            copy[index][key] = value;
            if (key === "label") {
                copy[index].name = value.toLowerCase().replace(/\s+/g, "_");
            }
            return copy;
        });

        if (liveValidate) validateField(index, key, value);
    };

    const validateName = (value) => {
        setErrors((prev) => {
            const copy = { ...prev };
            if (!value.trim()) {
                copy.name = "Form name is required.";
            } else {
                delete copy.name;
            }
            return copy;
        });
    };

    const setNameWithValidation = (value, liveValidate = true) => {
        setName(value);
        if (liveValidate) validateName(value);
    };

    const validateField = (index, key, value) => {
        setErrors((prev) => {
            const copy = { ...prev };
            const fieldErrors = copy[index] ? { ...copy[index] } : {};

            if (key === "label") {
                fieldErrors.label = !value.trim() ? "Field label is required." : "";
            }

            if (key === "options") {
                fieldErrors.options =
                    !value || value.length === 0 || value.every((opt) => !opt.trim()) ? "Options are required for select fields." : "";
            }

            // cleanup
            if (!fieldErrors.label && !fieldErrors.options) {
                delete copy[index];
            } else {
                copy[index] = fieldErrors;
            }
            return copy;
        });
    };

    const validate = () => {
        let valid = true;
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = "Form name is required.";
            valid = false;
        }
        if (fields.length === 0) {
            newErrors.fields = "At least one field is required.";
            valid = false;
        }

        fields.forEach((f, i) => {
            const fieldErrors = {};
            if (!f.label.trim()) {
                fieldErrors.label = "Field label is required.";
                valid = false;
            }
            if (f.field_type === "select" && (!f.options || f.options.length === 0 || f.options.every((o) => !o.trim()))) {
                fieldErrors.options = "Options required for select fields.";
                valid = false;
            }
            if (Object.keys(fieldErrors).length > 0) {
                newErrors[i] = fieldErrors;
            }
        });

        setErrors(newErrors);
        return valid;
    };

    return {
        name,
        setName: setNameWithValidation,
        description,
        setDescription,
        fields,
        addField,
        removeField,
        updateField,
        validate,
        errors,
        reset,
    };
}
