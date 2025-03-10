import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, Table, Badge } from 'antd';
import ReportModal from "./ReportModal";

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
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [complaintStats, setComplaintStats] = useState([]);
    const [commonComplaints, setCommonComplaints] = useState([]);
    const [maintenanceStatus, setMaintenanceStatus] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const summaryRes = await fetch('http://localhost:3000/api/reports/occupancy');
                const roomRes = await fetch('http://localhost:3000/api/reports/room-details');
                const deptRes = await fetch('http://localhost:3000/api/reports/department-wise');

                if (!summaryRes.ok || !roomRes.ok || !deptRes.ok) {
                    throw new Error("API response not OK");
                }

                const summaryData = await summaryRes.json();
                const roomData = await roomRes.json();
                const deptData = await deptRes.json();

                setSummary(summaryData);
                setRoomDetails(Array.isArray(roomData) ? roomData : []); // Ensure it's an array
                setDeptData(deptData);
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

    // useEffect(() => {
    //     let student = JSON.parse(localStorage.getItem("student"));
    //     let studentId = student._id;
    //     const fetchData = async () => {
    //         try {
    //             const res = await fetch(`http://localhost:3000/api/reports/student-payments/${studentId}`);
    //             setPayments(await res.json());
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //     fetchData();
    // }, [studentId]);

    useEffect(() => {
        const fetchData = async () => {
            const queries = new URLSearchParams(dateFilter);
            const [statsRes, commonRes, maintenanceRes, suggestionsRes] = await Promise.all([
                fetch(`http://localhost:3000/api/reports/complaint-stats?${queries}`),
                fetch(`http://localhost:3000/api/reports/common-complaints?${queries}`),
                fetch(`http://localhost:3000/api/reports/maintenance-status?${queries}`),
                fetch(`http://localhost:3000/api/reports/pending-suggestions?${queries}`)
            ]);

            setComplaintStats(await statsRes.json());
            setCommonComplaints(await commonRes.json());
            setMaintenanceStatus(await maintenanceRes.json());
            setSuggestions(await suggestionsRes.json());
        };
        fetchData();
    }, [dateFilter]);


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
    const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];

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
                    <div>
                        {/* Summary Section */}
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

                            {/* Revenue Breakdown Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                <div className="py-5 w-full mx-auto bg-gray-900 text-gray-100">
                                    {/* Date Filter Section (Remains Same) */}
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

                                    {/* Filtered Revenue Table */}
                                    <div className="bg-gray-800 p-6 shadow-xl">
                                        <h2 className="text-xl font-bold mb-4 text-emerald-400">
                                            Filtered Revenue Report
                                        </h2>

                                        {filteredRevenue.length > 0 ? (
                                            <Table
                                                dataSource={filteredRevenue}
                                                pagination={false}
                                                className="bg-gray-800 text-white"
                                                rowClassName="hover:bg-gray-700/20 transition-colors"
                                            >
                                                <Table.Column
                                                    title="Month"
                                                    dataIndex="month"
                                                    key="month"
                                                    render={(text) => (
                                                        <span className="text-gray-300">
                                                            {`${text.split('-')[1]}/${text.split('-')[0]}`}
                                                        </span>
                                                    )}
                                                />
                                                <Table.Column
                                                    title="Total Revenue (₹)"
                                                    dataIndex="total"
                                                    key="total"
                                                    render={(amount) => (
                                                        <div className="text-green-400 font-medium">
                                                            ₹{amount.toLocaleString('en-IN')}
                                                        </div>
                                                    )}
                                                    align="right"
                                                />
                                            </Table>
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

                            {/* Department-wise Distribution Table with Student Details */}
                            <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                                <h3 className="text-lg font-semibold mb-4 text-purple-400">
                                    Department-wise Distribution
                                </h3>

                                <Table
                                    dataSource={deptData}
                                    pagination={false}
                                    className="bg-gray-800 text-white"
                                    rowClassName="hover:bg-gray-700/30 transition-colors"
                                    expandable={{
                                        expandedRowRender: (record) => (
                                            <Table
                                                dataSource={record.students}
                                                rowKey="cms_id"
                                                className="bg-gray-700"
                                                pagination={false}
                                            >
                                                <Table.Column
                                                    title="CMS ID"
                                                    dataIndex="cms_id"
                                                    render={(id) => <span className="text-blue-300 font-mono">{id}</span>}
                                                />
                                                <Table.Column
                                                    title="Student Name"
                                                    dataIndex="name"
                                                    render={(name) => <span className="text-gray-200">{name}</span>}
                                                />
                                                <Table.Column
                                                    title="Batch"
                                                    dataIndex="batch"
                                                    render={(batch) => <span className="text-green-300">Batch {batch}</span>}
                                                />
                                                <Table.Column
                                                    title="Room"
                                                    dataIndex="room_no"
                                                    render={(room) => <span className="text-yellow-300">#{room}</span>}
                                                />
                                                <Table.Column
                                                    title="Contact"
                                                    render={(_, student) => (
                                                        <div className="space-y-1">
                                                            <div className="text-gray-400 text-sm">{student.email}</div>
                                                            <div className="text-gray-400 text-sm">
                                                                {student.contact.replace(/(\d{4})(\d{3})(\d{4})/, '$1-***-$3')}
                                                            </div>
                                                        </div>
                                                    )}
                                                />
                                            </Table>
                                        ),
                                        rowExpandable: (record) => record.students.length > 0,
                                        expandIcon: ({ expanded, onExpand, record }) =>
                                            record.students.length > 0 ? (
                                                <span
                                                    onClick={e => onExpand(record, e)}
                                                    className={`text-purple-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                                                >
                                                    ▶
                                                </span>
                                            ) : null
                                    }}
                                >
                                    <Table.Column
                                        title="Department"
                                        dataIndex="_id"
                                        key="department"
                                        render={(text) => (
                                            <span className="text-gray-300 capitalize">
                                                {text.toLowerCase().replace(/_/g, ' ')}
                                            </span>
                                        )}
                                    />
                                    <Table.Column
                                        title="Students"
                                        dataIndex="count"
                                        key="count"
                                        render={(count, record) => (
                                            <div className="flex items-center gap-2">
                                                <span className="text-purple-400 font-medium">
                                                    {count}
                                                </span>
                                                <span className="text-gray-400 text-xs">
                                                    ({((count / summary?.totalStudents) * 100 || 0).toFixed(1)}%)
                                                </span>
                                                <span className="text-gray-500 text-xs ml-2">
                                                    {record.students.length} entries
                                                </span>
                                            </div>
                                        )}
                                        align="right"
                                    />
                                </Table>

                                {deptData.length === 0 && (
                                    <div className="text-center py-4 text-gray-400">
                                        No department data available
                                    </div>
                                )}
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
                                            {Array.isArray(roomDetails) && roomDetails.length > 0 ? (
                                                roomDetails.map((room, index) => (
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
                                                ))
                                            ) : (
                                                <div>
                                                    <p>No rooms available</p>
                                                </div>
                                            )}
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
                                                    <td className="p-2">
                                                        <button
                                                            onClick={() => setSelectedInvoice(invoice)}
                                                            className="text-indigo-400 hover:text-indigo-300"
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}

                                        </tbody>
                                    </table>
                                    {selectedInvoice && (
                                        <ReportModal
                                            closeModal={() => setSelectedInvoice(null)}
                                            suggestion={selectedInvoice} // We'll modify the Modal to work with invoices
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Payment History */}
                            {/* <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
                                <h2 className="text-xl font-bold mb-4 text-blue-400">Payment History</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-gray-700">
                                                <th className="px-4 py-2 text-left text-sm text-gray-400">Date</th>
                                                <th className="px-4 py-2 text-left text-sm text-gray-400">Amount</th>
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
                            </div> */}
                        </div>

                        <div className='space-y-8'>
                            <div className="p-6 bg-gray-900 text-gray-100 space-y-8">
                                {/* Filters */}
                                {/* <div className="flex gap-4">
                                    <input
                                        type="date"
                                        className="bg-gray-700 text-white px-3 py-2 rounded"
                                        onChange={e => setDateFilter({ ...dateFilter, start: e.target.value })}
                                    />
                                    <input
                                        type="date"
                                        className="bg-gray-700 text-white px-3 py-2 rounded"
                                        onChange={e => setDateFilter({ ...dateFilter, end: e.target.value })}
                                    />
                                </div> */}

                                {/* Complaint Statistics */}
                                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-800 p-6 rounded-xl">
                                        <h3 className="text-xl font-bold mb-4">Complaint Status</h3>
                                        <PieChart width={400} height={300}>
                                            <Pie
                                                data={complaintStats}
                                                dataKey="count"
                                                nameKey="status"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label
                                            >
                                                {complaintStats.map((entry, index) => (
                                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </div>

                                    <div className="bg-gray-800 p-6 rounded-xl">
                                        <h3 className="text-xl font-bold mb-4">Common Complaint Types</h3>
                                        <BarChart width={400} height={300} data={commonComplaints}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="_id" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#4BC0C0" />
                                        </BarChart>
                                    </div>
                                </div> */}

                                {/* Maintenance Status */}
                                {/* <div className="bg-gray-800 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold mb-4">Maintenance Requests</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {maintenanceStatus.map((status, index) => (
                                            <div key={index} className="bg-gray-700 p-4 rounded-lg">
                                                <p className="text-sm text-gray-400">{status._id}</p>
                                                <p className="text-2xl font-bold">{status.count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div> */}

                                {/* Pending Suggestions */}
                                {/* <div className="bg-gray-800 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold mb-4">Pending Suggestions</h3>
                                    <div className="space-y-4">
                                        {suggestions.map(suggestion => (
                                            <div key={suggestion._id} className="bg-gray-700 p-4 rounded-lg">
                                                <h4 className="font-semibold">{suggestion.title}</h4>
                                                <p className="text-gray-400 text-sm">{suggestion.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </div>


                );
            })()}
        </div>
    );
};

export default Reports;