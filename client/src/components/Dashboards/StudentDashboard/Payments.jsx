import { useState, useEffect } from "react";

const student = JSON.parse(localStorage.getItem("student"));

function Payments() {
  const [paymentList, setPaymentList] = useState([]);
  const [totalPayments, setTotalPayments] = useState([]);
  const [completedPayments, setCompletedPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);

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
    fetch("http://localhost:3000/api/payment/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student._id }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log("✅ Payments API Response:", data);
          // ✅ Only show pending payments
          setPaymentList(data.payments.filter(p => p.paymentStatus === "pending"));
        } else {
          console.error("❌ Payment API Failed:", data.message);
        }
      })
      .catch((error) => console.error("❌ Error fetching payments:", error));
  }, []);




  const handlePayment = async (payment) => {
    if (!payment || !payment.amount) {
      console.error("Error: Payment is undefined or missing amount");
      alert("Something went wrong. Please try again.");
      return;
    }

    try {
      console.log("📩 Sending payment request for:", payment);

      const response = await fetch("http://localhost:3000/api/payment/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student._id, amount: payment.amount, paymentId: payment._id }),  // ✅ Include paymentId
      });

      const data = await response.json();
      console.log("🛜 Server Response Data:", data);

      if (data.success) {
        console.log("✅ Redirecting to Stripe Checkout:", data.sessionUrl);
        window.location.href = data.sessionUrl;  // ✅ Redirects to Stripe
      } else {
        console.error("❌ Payment session creation failed:", data.message);
        alert("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("❌ Payment Error:", error);
      alert("Something went wrong.");
    }
  };




  return (
    <div className="w-full h-screen flex flex-col gap-5 items-center justify-center max-h-screen overflow-y-auto">
      <h1 className="text-white font-bold text-5xl">Payments</h1>
      <p className="text-white text-xl text-center px-5 sm:p-0">
        All completed payments are listed here.
      </p>

      <div className="w-full max-w-md p-4 border rounded-lg shadow sm:p-8 bg-neutral-950 border-neutral-900 drop-shadow-xl overflow-y-auto max-h-70">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-xl font-bold leading-none text-white">
            Recent Payments
          </h5>
        </div>
        <div className="flow-root">
          <ul role="list" className="divide-y divide-gray-700">
            {paymentList.map((payment, index) => (
              <li className="py-3 sm:py-4" key={payment.id || `Payment-${index}`}>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">
                      Payment of {payment.amount}
                    </p>
                    <p className="text-sm truncate text-gray-400">
                      {payment.date}
                    </p>
                  </div>
                  <div className={`flex text-base font-semibold ${payment.status === "Completed" ? "text-green-500" : "text-yellow-500"}`}>
                    {payment.status}
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                      onClick={() => handlePayment(payment)} // ✅ Now correctly passing invoice
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Payments;