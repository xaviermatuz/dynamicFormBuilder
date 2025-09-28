import * as Tooltip from "@radix-ui/react-tooltip";
import { EraserIcon, UserRoundPenIcon } from "lucide-react";

export function UserRow({ item, user, onEdit, onDelete, variant = "table" }) {
    if (variant === "card") {
        // Mobile card layout
        return (
            <div className='bg-white shadow rounded p-4 flex flex-col gap-2 text-sm sm:text-base'>
                <div>
                    <span className='font-medium'>Username:</span> {item.username}
                </div>
                <div>
                    <span className='font-medium'>Email:</span> {item.email}
                </div>
                <div>
                    <span className='font-medium'>Role:</span> {item.role}
                </div>
                <div>
                    <span className='font-medium'>Status:</span> {item.is_active ? "Active" : "Inactive"}
                </div>
                <div>
                    <span className='font-medium'>Last login:</span>{" "}
                    {item.last_login && !isNaN(new Date(item.last_login)) ? new Date(item.last_login).toLocaleString() : "None"}
                </div>

                {user?.roles?.includes("admin") && (
                    <div className='flex flex-wrap gap-2 mt-2'>
                        <button className='px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600' onClick={() => onEdit(item)}>
                            Edit
                        </button>
                        <button className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600' onClick={() => onDelete(item.id)}>
                            Delete
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Default: table row layout
    return (
        <tr className='border-t hover:bg-gray-50 text-center'>
            <td className='py-2 px-4'>{item.id}</td>
            <td className='py-2 px-4 capitalize'>{item.username}</td>
            <td className='py-2 px-4'>{item.email}</td>
            <td className='py-2 px-4'>{item.role}</td>
            <td className='py-2 px-4'>
                {item.is_active ? (
                    <span className='bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold'>Active</span>
                ) : (
                    <span className='bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold'>Inactive</span>
                )}
            </td>
            <td className='py-2 px-4'>
                {item.last_login && !isNaN(new Date(item.last_login)) ? new Date(item.last_login).toLocaleString() : "None"}
            </td>
            <td className='py-2 px-4 flex flex-wrap gap-1 justify-center'>
                {user?.roles?.includes("admin") && (
                    <>
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <button className='px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600' onClick={() => onEdit(item)}>
                                    <UserRoundPenIcon />
                                </button>
                            </Tooltip.Trigger>
                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                Edit this user
                                <Tooltip.Arrow className='fill-gray-800' />
                            </Tooltip.Content>
                        </Tooltip.Root>

                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <button className='px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600' onClick={() => onDelete(item.id)}>
                                    <EraserIcon />
                                </button>
                            </Tooltip.Trigger>
                            <Tooltip.Content className='bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-md'>
                                Delete this user
                                <Tooltip.Arrow className='fill-gray-800' />
                            </Tooltip.Content>
                        </Tooltip.Root>
                    </>
                )}
            </td>
        </tr>
    );
}
