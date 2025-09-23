import React, { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import { notifyError, notifySuccess } from "../../../utils/toast";
import { deleteItem } from "../../../utils/useDelete";

export default function DashboardPage() {
    return (
        <div>
            <h2 className='text-3xl font-bold mb-4'>Dashboard</h2>
            <p>This is the Dashboard page.</p>
        </div>
    );
}
