import React from "react";

/**
 * SelectAllCheckbox Component
 *
 * Props:
 * - items: array of objects
 * - selectedIds: array of selected keys
 * - idKey: function(item) => string (stable key extractor)
 * - onChange: function(newSelectedIds: string[]) => void
 */
export default function SelectAllCheckbox({ items = [], selectedIds = [], idKey, onChange }) {
    const isAllSelected = items.length > 0 && selectedIds.length === items.length;

    const handleChange = (e) => {
        if (e.target.checked) {
            onChange(items.map(idKey));
        } else {
            onChange([]);
        }
    };

    return <input type='checkbox' checked={isAllSelected} onChange={handleChange} />;
}
