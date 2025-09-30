import React from "react";

/**
 * RowCheckbox Component
 *
 * Props:
 * - item: the current row item
 * - idKey: function(item) => string (stable key extractor)
 * - selectedIds: array of selected keys
 * - onToggle: function(item) => void
 */
export default function RowCheckbox({ item, idKey, selectedIds, onToggle }) {
    const key = idKey(item);
    const isChecked = selectedIds.includes(key);

    return <input type='checkbox' checked={isChecked} onChange={() => onToggle(item)} />;
}
