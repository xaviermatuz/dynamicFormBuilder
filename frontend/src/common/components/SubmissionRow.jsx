import * as Tooltip from "@radix-ui/react-tooltip";
import { ScanEyeIcon, Trash2Icon } from "lucide-react";

export function SubmissionRow({ item, user, onView, onDelete, variant }) {
    if (variant === "table") {
        return (
            <tr key={item.id} className='border-t hover:bg-gray-50 text-center'>
                {user?.roles?.includes("admin") ? (
                    <>
                        <td className='py-2 px-4'>{item.id}</td>
                        <td className='py-2 px-4'>{item.form}</td>
                        <td className='py-2 px-4'>{item.form_name}</td>
                        <td className='py-2 px-4'>{item.form_version}</td>
                        <td className='py-2 px-4'>{item.submitted_by}</td>
                        <td className='py-2 px-4'>{new Date(item.submitted_at).toLocaleString()}</td>
                    </>
                ) : (
                    <>
                        <td className='py-2 px-4'>{item.form_name}</td>
                        <td className='py-2 px-4'>{new Date(item.submitted_at).toLocaleString()}</td>
                    </>
                )}
                <td className='py-2 px-4 flex flex-wrap gap-1 justify-center'>
                    <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                            <button className='px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600' onClick={() => onView(item)}>
                                <ScanEyeIcon />
                            </button>
                        </Tooltip.Trigger>
                        <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                            View submission
                            <Tooltip.Arrow className='fill-gray-800' />
                        </Tooltip.Content>
                    </Tooltip.Root>

                    {user?.roles?.includes("admin") && (
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <button className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600' onClick={() => onDelete(item.id)}>
                                    <Trash2Icon />
                                </button>
                            </Tooltip.Trigger>
                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                Delete submission
                                <Tooltip.Arrow className='fill-gray-800' />
                            </Tooltip.Content>
                        </Tooltip.Root>
                    )}
                </td>
            </tr>
        );
    }

    // Mobile (card view)
    return (
        <div key={item.id} className='bg-white shadow rounded p-4 flex flex-col gap-2 text-sm sm:text-base'>
            <div>
                <span className='font-medium'>Form:</span> {item.form_name}
            </div>
            <div>
                <span className='font-medium'>Submitted:</span> {new Date(item.submitted_at).toLocaleString()}
            </div>
            <div className='flex flex-wrap gap-2 mt-2'>
                <button className='px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600' onClick={() => onView(item)}>
                    <ScanEyeIcon />
                </button>
                {user?.roles?.includes("admin") && (
                    <button className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600' onClick={() => onDelete(item.id)}>
                        <Trash2Icon />
                    </button>
                )}
            </div>
        </div>
    );
}
