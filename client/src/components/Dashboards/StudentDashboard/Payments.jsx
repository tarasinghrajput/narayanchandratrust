import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Payments() {
  const navigate = useNavigate();
  const [paymentList, setPaymentList] = useState([]);
  
  useEffect(() => {
    let student = JSON.parse(localStorage.getItem("student")) || {};
    fetch("http://localhost:3000/api/payments/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student: student._id }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log("✅ Payments API Response:", data);
          // Add `enteredAmount` field to each payment to track user input
          const updatedPayments = data.payments.map(payment => ({
            ...payment,
            enteredAmount: "", // Initialize with empty value
          }));
          setPaymentList(updatedPayments);
        } else {
          console.error("❌ Payment API Failed:", data.message);
        }
      })
      .catch(error => console.error("❌ Error fetching payments:", error));
  }, []);

  // Function to handle the "Pay Now" button click
  const handlePayment = (paymentId, amount) => {
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }
    
    const student = JSON.parse(localStorage.getItem("student")) || {};
    const studentId = student._id;

    try {
      console.log(`🔄 Navigating to checkout with Amount: ₹${amount}`);
      navigate(`/student-dashboard/checkout/${studentId}/${amount}`);
    } catch (error) {
      alert("Payment initiation failed");
    }
  };

  return (
    <div className="w-full h-screen flex flex-col gap-5 items-center justify-center max-h-screen overflow-y-auto">
      <h1 className="text-white font-bold text-5xl">Payments</h1>
      <p className="text-white text-xl text-center px-5 sm:p-0">
        View and manage your hostel payments.
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Due Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Enter Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {paymentList.map((payment, index) => (
              <tr key={payment._id} className="hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  ₹{payment.totalAmount?.toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    payment.paymentStatus.toLowerCase() === 'pending'
                      ? 'bg-yellow-800 text-yellow-400'
                      : payment.paymentStatus.toLowerCase() === 'paid'
                        ? 'bg-green-800 text-green-400'
                        : 'bg-red-800 text-red-400'
                  }`}>
                    {payment.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  ₹{payment.dueAmount?.toLocaleString('en-IN')}
                </td>

                {/* New Column: Enter Amount */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    className="w-24 px-2 py-1 text-black border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="number"
                    placeholder="Enter amount"
                    value={payment.enteredAmount}
                    onChange={(e) => {
                      const updatedPayments = [...paymentList];
                      updatedPayments[index].enteredAmount = Number(e.target.value);
                      setPaymentList(updatedPayments);
                    }}
                    min="1"
                    max={payment.dueAmount}
                    required
                  />
                </td>

                {/* Action Button */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.paymentStatus.toLowerCase() === "pending" && (
                    <button
                      onClick={() => handlePayment(payment._id, payment.enteredAmount)}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-wider hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring ring-indigo-300 disabled:opacity-25 transition ease-in-out duration-150"
                      disabled={!payment.enteredAmount || payment.enteredAmount <= 0}
                    >
                      Pay Now
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {paymentList.length === 0 && (
          <div className="text-center py-6 bg-gray-900">
            <p className="text-gray-400">No pending payments found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Payments;