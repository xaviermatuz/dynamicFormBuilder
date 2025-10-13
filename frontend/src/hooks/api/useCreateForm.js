import { useState, useEffect } from "react";

export function useSchemaForm(editItem = null) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [fields, setFields] = useState([]);
    const [errors, setErrors] = useState({
        name: "",
        atLeastOne: "",
        fields: {},
    });

    // Reset
    const reset = () => {
        setName("");
        setDescription("");
        setFields([]);
        setErrors({ name: "", atLeastOne: "", fields: {} });
    };

    useEffect(() => {
        if (editItem) {
            setName(editItem.name || "");
            setDescription(editItem.description || "");
            setFields(
                (editItem.fields || []).map((f, i) => ({
                    ...f,
                    id: f.id ?? crypto.randomUUID(), // preserve backend id if it exists
                    order: f.order ?? i + 1,
                    options: f.options || [],
                }))
            );
        } else {
            reset();
        }
    }, [editItem]);

    // Add field
    const addField = () => {
        setFields((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                name: "",
                label: "",
                field_type: "text",
                required: false,
                order: prev.length + 1,
                options: [],
            },
        ]);
    };

    // Remove field
    const removeField = (id) => {
        setFields((prev) => prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i + 1 })));

        setErrors((prev) => {
            const copy = { ...prev, fields: { ...prev.fields } };
            delete copy.fields[id];
            return copy;
        });
    };

    // Update field
    const updateField = (id, key, value, liveValidate = true) => {
        console.log("updateField called:", id, key, value); // 🔍 DEBUG
        setFields((prev) =>
            prev.map((f) => {
                if (f.id !== id) return f;
                const updated = { ...f, [key]: value };
                if (key === "label") {
                    updated.name = value.toLowerCase().replace(/\s+/g, "_");
                }
                return updated;
            })
        );

        if (liveValidate) validateField(id, key, value);
    };

    // Validation
    const validateField = (id, key, value) => {
        setErrors((prev) => {
            const copy = { ...prev, fields: { ...prev.fields } };
            const fieldErrors = copy.fields[id] ? { ...copy.fields[id] } : {};

            if (key === "label") {
                fieldErrors.label = !value.trim() ? "Field label is required." : "";
            }

            if (key === "options") {
                fieldErrors.options =
                    !value || value.length === 0 || value.every((opt) => !opt.trim()) ? "Options are required for select fields." : "";
            }

            if (!fieldErrors.label && !fieldErrors.options) {
                delete copy.fields[id];
            } else {
                copy.fields[id] = fieldErrors;
            }
            return copy;
        });
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

    const validate = () => {
        let valid = true;
        const newErrors = { name: "", atLeastOne: "", fields: {} };

        if (!name.trim()) {
            newErrors.name = "Form name is required.";
            valid = false;
        }

        if (fields.length === 0) {
            newErrors.atLeastOne = "At least one field is required.";
            valid = false;
        }

        fields.forEach((f) => {
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
                newErrors.fields[f.id] = fieldErrors;
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
        setFields, // ✅ for drag-and-drop
        addField,
        removeField,
        updateField,
        validate,
        errors,
        reset,
    };
}
