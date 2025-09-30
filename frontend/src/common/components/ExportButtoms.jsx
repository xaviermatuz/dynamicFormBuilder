import React, { useState, useCallback } from "react";
import { FileDownIcon } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

/**
 * ExportButtons Component
 *
 * Props:
 * - items: array of objects with at least `id` or `key`
 * - exporter: function(data: any[], filename: string) => void
 * - notifyWarning: function(message: string) => void
 */
export default function ExportButtons({ items = [], exporter, notifyWarning, selectedIds, setSelectedIds }) {
    const idKey = useCallback((item) => item.id || item.key || JSON.stringify(item), []);

    const getSelectedData = useCallback(() => items.filter((i) => selectedIds.includes(idKey(i))), [items, selectedIds, idKey]);

    const handleExportSelected = () => {
        const selected = getSelectedData();
        if (selected.length === 0) {
            notifyWarning?.("No rows selected!");
            return;
        }
        exporter?.(selected, "selected-rows.json");
    };

    return (
        <div className='flex gap-2'>
            {/* Selected */}
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <button
                        onClick={handleExportSelected}
                        className='flex items-center justify-center bg-green-500 text-white rounded hover:bg-green-600 w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2'
                    >
                        <FileDownIcon className='w-5 h-5' />
                        <span className='hidden sm:inline ml-2'>Download</span>
                    </button>
                </Tooltip.Trigger>
                <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                    Download Selected schemas
                    <Tooltip.Arrow className='fill-gray-800' />
                </Tooltip.Content>
            </Tooltip.Root>
        </div>
    );
}
