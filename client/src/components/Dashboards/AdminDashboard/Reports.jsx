import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, Table, Badge } from 'antd';

const Reports = () => {
    const [summary, setSummary] = useState(null);
    const [roomDetails, setRoomDetails] = useState([]);
    const [deptData, setDeptData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState([]);
    const [overdueInvoices, setOverdueInvoices] = useState([]);
    const [revenueBreakdown, setRevenueBreakdown] = useState([]);
    const { studentId } = useParams();
    const [payments, setPayments] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filteredRevenue, setFilteredRevenue] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const summaryRes = await fetch('http://localhost:3000/api/reports/occupancy');
                const roomRes = await fetch('http://localhost:3000/api/reports/room-details');
                const deptRes = await fetch('http://localhost:3000/api/reports/department-wise');

                setSummary(await summaryRes.json());
                setRoomDetails(await roomRes.json());
                setDeptData(await deptRes.json());
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const monthlyRes = await fetch('http://localhost:3000/api/reports/monthly-collections');
                const overdueRes = await fetch('http://localhost:3000/api/reports/overdue-invoices');
                const revenueRes = await fetch('http://localhost:3000/api/reports/revenue-breakdown');

                setMonthlyData(await monthlyRes.json());
                setOverdueInvoices(await overdueRes.json());
                setRevenueBreakdown(await revenueRes.json());
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/financial/student-payments/${studentId}`);
                setPayments(await res.json());
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);


    // Add this fetch function
    const fetchFilteredRevenue = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await fetch(`http://localhost:3000/api/reports/filtered-revenue?${params}`);
            const data = await res.json();
            setFilteredRevenue(data);
        } catch (error) {
            console.error('Error fetching filtered revenue:', error);
        }
    };


    if (loading) {
        return <div className="p-6 text-center">Loading reports...</div>;
    }

    // Color scheme for charts
    // const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="px-4 py-20 max-w-7xl mx-auto space-y-8 bg-gray-900 text-white h-screen overflow-y-auto">
            {/* Dark theme color palette */}
            {(() => {
                const DARK_COLORS = [
                    '#4F46E5',  // Indigo
                    '#10B981',  // Emerald
                    '#F59E0B',  // Amber
                    '#EF4444',  // Red
                    '#8B5CF6',  // Purple
                    '#3B82F6',  // Blue
                ];

                return (
                    <>
                        {/* Summary Section */}
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                            {/* Monthly Collections */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                                <h2 className="text-xl font-bold mb-4 text-white">
                                    Monthly Payment Collections
                                </h2>
                                <BarChart width={800} height={300} data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="month" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="total"
                                        fill={DARK_COLORS[0]}
                                        name="Total Collections (₹)"
                                    />
                                </BarChart>
                            </div>

                            {/* Revenue Breakdown Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                <div className="py-5 w-full mx-auto bg-gray-900 text-gray-100">
                                    {/* Date Filter Section */}
                                    <div className="flex gap-4 items-center bg-gray-800 p-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium text-gray-300">From Date</label>
                                            <input
                                                type="date"
                                                className="bg-gray-700 text-white px-3 py-2 rounded-lg"
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-medium text-gray-300">To Date</label>
                                            <input
                                                type="date"
                                                className="bg-gray-700 text-white px-3 py-2 rounded-lg"
                                                onChange={(e) => setEndDate(e.target.value)}
                                            />
                                        </div>

                                        <button
                                            onClick={fetchFilteredRevenue}
                                            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                                        >
                                            Apply Filter
                                        </button>
                                    </div>

                                    {/* Filtered Revenue Display */}
                                    <div className="bg-gray-800 p-6 shadow-xl">
                                        <h2 className="text-xl font-bold mb-4 text-emerald-400">
                                            Filtered Revenue Report
                                        </h2>

                                        {filteredRevenue.length > 0 ? (
                                            <BarChart width={800} height={400} data={filteredRevenue}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                <XAxis
                                                    dataKey="month"
                                                    stroke="#9CA3AF"
                                                    tickFormatter={(value) => `${value.split('-')[1]}/${value.split('-')[0]}`}
                                                />
                                                <YAxis stroke="#9CA3AF" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1F2937',
                                                        border: '1px solid #374151',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Legend />
                                                <Bar
                                                    dataKey="total"
                                                    fill="#4F46E5"
                                                    name="Total Revenue (₹)"
                                                />
                                            </BarChart>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                No revenue data found for selected period
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Occupancy Cards */}
                                <div className="space-y-6 grid-col-2">
                                    <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                                        <h3 className="text-lg font-semibold mb-4 text-amber-400">
                                            Occupancy Summary
                                        </h3>
                                        <div className="space-y-3 text-gray-300">
                                            <p>Total Rooms: {summary?.totalRooms || 35}</p>
                                            <p>Occupied: {summary?.occupiedRooms || 0}</p>
                                            <p>Vacant: {summary?.vacantRooms || 0}</p>
                                            <p>Occupancy Rate: {summary?.occupancyRate || 0}%</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                                        <h3 className="text-lg font-semibold mb-4 text-blue-400">
                                            Student Statistics
                                        </h3>
                                        <div className="space-y-3 text-gray-300">
                                            <p>Total Students: {summary?.totalStudents || 0}</p>
                                            <p>Available Beds: {summary?.availableBeds || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Department Distribution */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                                <h3 className="text-lg font-semibold mb-4 text-purple-400">
                                    Department-wise Distribution
                                </h3>
                                <BarChart width={600} height={300} data={deptData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="_id" stroke="#9CA3AF" />
                                    <YAxis stroke="#9CA3AF" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill={DARK_COLORS[4]}
                                    />
                                </BarChart>
                            </div>
                        </div>

                        {/* Data Tables Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                            {/* Room Status Table */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                                <h3 className="text-lg font-semibold mb-4 text-red-400">
                                    Room-wise Status
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-gray-700">
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Room</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Occupants</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Available Beds</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {roomDetails.map((room, index) => (
                                                <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 font-medium">#{room.roomNumber}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${room.status === 'available'
                                                            ? 'bg-green-800/30 text-green-400'
                                                            : 'bg-red-800/30 text-red-400'
                                                            }`}>
                                                            {room.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-300">
                                                        {room.occupants.join(', ') || 'No occupants'}
                                                    </td>
                                                    <td className="px-6 py-4">{room.availableBeds}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Overdue Invoices */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                                <h2 className="text-xl font-bold mb-4 text-yellow-400">
                                    Overdue Invoices ({overdueInvoices.length})
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-gray-700">
                                                <th className="p-2 text-left text-sm text-gray-400">Student</th>
                                                <th className="p-2 text-left text-sm text-gray-400">Amount</th>
                                                <th className="p-2 text-left text-sm text-gray-400">Days Overdue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {overdueInvoices.map(invoice => (
                                                <tr key={invoice._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                    <td className="p-2 text-gray-300">{invoice.student?.name || 'N/A'}</td>
                                                    <td className="p-2">₹{invoice.amount}</td>
                                                    <td className="p-2 text-red-400">
                                                        {Math.floor((new Date() - new Date(invoice.date)) / (1000 * 3600 * 24))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Payment History */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                            <h2 className="text-xl font-bold mb-4 text-blue-400">Payment History</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="px-4 py-2 text-left text-sm text-gray-400">Date</th>
                                            <th className="px-4 py-2 text-left text-sm text-gray-400">Amount</th>
                                            <th className="px-4 py-2 text-left text-sm text-gray-400">Invoice</th>
                                            <th className="px-4 py-2 text-left text-sm text-gray-400">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(payment => (
                                            <tr key={payment._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="px-4 py-2 text-gray-300">
                                                    {new Date(payment.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-2">₹{payment.amount}</td>
                                                <td className="px-4 py-2 text-gray-300">{payment.invoice?.title}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${payment.paymentStatus === 'paid'
                                                        ? 'bg-green-800/30 text-green-400'
                                                        : 'bg-yellow-800/30 text-yellow-400'
                                                        }`}>
                                                        {payment.paymentStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                );
            })()}
        </div>
    );
};

export default Reports;