import { useState, useEffect } from "react";
import { Link } from "react-router-dom";


function Payments() {
  const [paymentList, setPaymentList] = useState([]);
  const [showPending, setShowPending] = useState(true); // Toggle between pending & completed
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  const invoiceAmount = 8400;
  // const [totalPayments, setTotalPayments] = useState([]);
  // const [completedPayments, setCompletedPayments] = useState([]);
  // const [pendingPayments, setPendingPayments] = useState([]);

  // useEffect(() => {
  //   fetch("http://localhost:3000/api/payment/student", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ studentId: student._id }),
  //   })
  //     .then(res => res.json())
  //     .then(data => {
  //       if (data.success) {
  //         let paidCount = 0;
  //         let pendingCount = 0;
  //         let paymentsList = [];

  //         data.payments.forEach((payment) => {
  //           if (payment.paymentStatus.toLowerCase() === "completed") {
  //             paidCount += 1;
  //           } else {
  //             pendingCount += 1;
  //           }
  //           paymentsList.push({
  //             id: payment._id,
  //             amount: `₹ ${payment.amount}`,
  //             date: new Date(payment.date).toLocaleDateString("en-US", {
  //               day: "numeric",
  //               month: "long",
  //               year: "numeric",
  //             }),
  //             status: payment.paymentStatus,
  //           });
  //         });

  //         setPaymentList(paymentsList);
  //         setTotalPayments(data.payments.length);
  //         setCompletedPayments(paidCount);
  //         setPendingPayments(pendingCount);
  //       }
  //     })
  //     .catch((error) => console.error("❌ Error fetching payments:", error));
  // }, []);

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
          setPaymentList(data.payments);
        } else {
          console.error("❌ Payment API Failed:", data.message);
        }
      })
      .catch((error) => console.error("❌ Error fetching payments:", error));
  }, []);



  const handlePayment = async (payment) => {
    const student = JSON.parse(localStorage.getItem("student")) || {};
    try {
      const response = await fetch("http://localhost:3000/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student._id,
          paymentType: selectedPlan
        }),
      });

      const data = await response.json();
      if (data.success) {
        window.location.href = data.sessionUrl;
      }
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
      {/* <button
        className="bg-gray-800 text-white px-4 py-2 rounded mt-4"
        onClick={() => setShowPending(!showPending)}
      >
        Show {showPending ? "Completed" : "Pending"} Payments
      </button> */}

      {/* <div className="flex gap-4 mb-4">
        <p className="text-white text-xl text-center px-5 sm:p-0">
          First Select the Payment Type.
        </p>
        <button
          className={`px-4 py-2 rounded ${selectedPlan === "monthly" ? "bg-blue-500" : "bg-gray-700"}`}
          onClick={() => setSelectedPlan("monthly")}
        >
          Monthly
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedPlan === "annual" ? "bg-blue-500" : "bg-gray-700"}`}
          onClick={() => setSelectedPlan("annual")}
        >
          Annual
        </button>
      </div> */}

      <div className="w-full h-40 flex flex-col gap-5 items-center justify-center">
        {/* Plan Selector */}
        <div className="flex gap-4 mb-6">
          <button
            className={`px-6 py-3 rounded-lg ${selectedPlan === "monthly"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
              }`}
            onClick={() => setSelectedPlan("monthly")}
          >
            Monthly (₹{invoiceAmount}/month)
          </button>

          <button
            className={`px-6 py-3 rounded-lg ${selectedPlan === "annual"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700"
              }`}
            onClick={() => setSelectedPlan("annual")}
          >
            Annual (₹{invoiceAmount * 12}/year)
          </button>
        </div>

        {/* Payment List */}
        {paymentList
          .filter(payment => payment.paymentStatus.toLowerCase() === "pending")
          .map((payment) => (
            <div key={payment.id} className="payment-item">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => handlePayment(payment)}
              >
                Pay Now ({selectedPlan})
              </button>
            </div>
          ))}
      </div>


      {/* <div className="w-full max-w-md p-4 border rounded-lg shadow sm:p-8 bg-neutral-950 border-neutral-900 drop-shadow-xl overflow-y-auto max-h-70">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-xl font-bold leading-none text-white">
            {showPending ? "Pending" : "Completed"} Payments
          </h5>
        </div>
        <div className="flow-root">
          <ul role="list" className="divide-y divide-gray-700">
            {paymentList
              .filter(payment => showPending ? payment.paymentStatus.toLowerCase() === "pending" : payment.paymentStatus.toLowerCase() === "completed")
              .map((payment, index) => (
                <li className="py-3 sm:py-4" key={payment.id || `Payment-${index}`}>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white">
                        Payment of ₹{payment.amount}
                      </p>
                      <p className="text-sm truncate text-gray-400">
                        {new Date(payment.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className={`flex text-base font-semibold ${payment.paymentStatus.toLowerCase() === "completed" ? "text-green-500" : "text-yellow-500"}`}>
                      {payment.paymentStatus}
                    </div>
                    {payment.paymentStatus.toLowerCase() === "pending" && (
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => handlePayment(payment)}
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div> */}
    </div>
  );
}

export default Payments;