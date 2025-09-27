import React, { useEffect, useState } from "react";
import { notifyError } from "../../../utils/toast";
import { useAuth } from "../../../context/AuthContext";
import { LineChart, Line, Tooltip, ResponsiveContainer } from "recharts";
import CountUp from "react-countup";
import { Home } from "lucide-react";
import { useApi } from "../../../hooks/api/useApi";

const CounterCard = ({ title, value, data, gradientFrom, gradientTo }) => {
    return (
        <div
            className='rounded-lg p-4 text-white flex flex-col justify-between'
            style={{ background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` }}
        >
            <div>
                {/* Animated Counter */}
                <h2 className='text-2xl font-bold'>
                    <CountUp end={value} duration={2} separator=',' />
                </h2>
                <p className='uppercase text-sm font-semibold'>{title}</p>
            </div>
            <div className='h-16 mt-2'>
                <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={data}>
                        <Line type='monotone' dataKey='uv' stroke='#fff' strokeWidth={2} dot={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#333",
                                border: "none",
                                borderRadius: "4px",
                                color: "#fff",
                                fontSize: "12px",
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default function DashboardPage() {
    const { user } = useAuth();

    const [metrics, setMetrics] = useState(null);
    const { request, loading: apiLoading, error } = useApi();

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const data = await request({
                    endpoint: "/dashboard/metrics/",
                });

                // Format history arrays into Recharts-friendly objects
                const formatData = (arr) => arr.map((v) => ({ uv: v }));

                setMetrics({
                    users: { count: data.users.count, history: formatData(data.users.history) },
                    forms: { count: data.forms.count, history: formatData(data.forms.history) },
                    submissions: { count: data.submissions.count, history: formatData(data.submissions.history) },
                });
            } catch (err) {
                console.error("Error fetching metrics:", err);
                notifyError(err.message);
            }
        };

        fetchMetrics();
    }, []);

    if (!metrics) {
        return <div className='text-gray-600 p-4'>Loading metrics...</div>;
    }

    return (
        <div className='p-2 sm:p-4 lg:p-6 xl:p-8'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-4 flex items-center gap-2'>
                <Home className='w-6 h-6' />
                Dashboard
            </h1>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4'>
                {user.roles?.includes("admin") && (
                    <CounterCard title='Users' value={metrics.users.count} data={metrics.users.history} gradientFrom='#36D1DC' gradientTo='#5B86E5' />
                )}
                <CounterCard title='Forms' value={metrics.forms.count} data={metrics.forms.history} gradientFrom='#4facfe' gradientTo='#00f2fe' />
                <CounterCard
                    title='Submissions'
                    value={metrics.submissions.count}
                    data={metrics.submissions.history}
                    gradientFrom='#ff9966'
                    gradientTo='#ff5e62'
                />
            </div>
        </div>
    );
}
