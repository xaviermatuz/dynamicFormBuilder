import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FieldEditor from "./FieldEditor";

export default function FieldList({ fields, setFields, updateField, removeField, errors }) {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over.id);
            const reordered = arrayMove(fields, oldIndex, newIndex).map((f, i) => ({
                ...f,
                order: i + 1, // keep order in sync
            }));
            setFields(reordered);
        }
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                {fields.map((f) => (
                    <SortableItem key={f.id} id={f.id}>
                        <FieldEditor field={f} onChange={updateField} onRemove={removeField} error={errors.fields?.[f.id]} />
                    </SortableItem>
                ))}
            </SortableContext>
        </DndContext>
    );
}

// Wrapper for drag styling
function SortableItem({ id, children }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className='flex items-center gap-2'>
            {/* Drag handle */}
            <span {...listeners} className='cursor-grab px-2 text-gray-500 hover:text-gray-700 select-none' title='Drag to reorder'>
                ☰
            </span>

            {/* Editable content */}
            <div className='flex-1'>{children}</div>
        </div>
    );
}
