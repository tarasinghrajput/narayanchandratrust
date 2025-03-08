import { useState, useEffect } from "react";
import { ToastContainer ,toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import jspdf from "jspdf";

// const downloadInvoice = (invoice) => {
//   const doc = new jsPDF();
//   doc.text(`Invoice: ${invoice.title}`, 10, 10);
//   doc.text(`Amount: ${invoice.amount}`, 10, 20);
//   doc.text(`Status: ${invoice.status}`, 10, 30);
//   doc.save(`${invoice.title}.pdf`);
// };

const student = JSON.parse(localStorage.getItem("student")) || {};

function Invoices() {
  const [invoiceList, setInvoiceList] = useState([]);
  // const [totalInvoices, setTotalInvoices] = useState(0);
  // const [pendingInvoices, setPendingInvoices] = useState(0);
  // const [paidInvoices, setPaidInvoices] = useState(0);

  // useEffect(() => {
  //   const fetchInvoices = async () => {
  //     // let student = JSON.parse(localStorage.getItem("student"));

  //     try {
  //       const res = await fetch("http://localhost:3000/api/invoice/student", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ student: student._id }),
  //       });

  //       const data = await res.json();
  //       if (data.success) {
  //         setInvoiceList(data.invoices);
  //       } else {
  //         console.error("❌ Error fetching invoices:", data.message);
  //       }
  //     } catch (err) {
  //       console.error("❌ Network error:", err);
  //     }

  //     // Fetch invoices initially
  //     fetchInvoices();

  //     // ✅ Fetch updated invoice if redirected from Stripe
  //     if (sessionId) {
  //       fetch(`http://localhost:3000/api/invoice/confirm-payment?session_id=${sessionId}`)
  //         .then((res) => res.json())
  //         .then((data) => {
  //           if (data.success) {
  //             alert("✅ Payment confirmed! Invoice updated.");
  //             window.location.href = "/student-dashboard/invoices";
  //           } else {
  //             alert(`❌ Error: ${data.message}`);
  //           }
  //         })
  //         .catch((err) => {
  //           console.error("❌ Payment confirmation error:", err);
  //           alert("❌ Server error while confirming payment.");
  //         });
  //     }
  //   }
  // }, []);




  const [totalInvoices, setTotalInvoices] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);
  const [paidInvoices, setPaidInvoices] = useState(0);

  useEffect(() => {
    fetch("http://localhost:3000/api/invoice/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student: student._id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          let invoices = data.invoices;
          let List = [];
          let paidInvoicesCount = 0;
          let pendingInvoicesCount = 0;

          invoices.forEach((invoice) => {
            if (invoice.status.toLowerCase() === "paid") {
              paidInvoicesCount += 1;
            } else {
              pendingInvoicesCount += 1;
            }
            console.log(invoice.title);
            let date = new Date(invoice.date);
            invoice.date = date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
            List.push({
              title: invoice.title,
              amount: "₹ " + invoice.amount,
              status: invoice.status,
              date: invoice.date,
            });
          });

          setInvoiceList(List);
          setTotalInvoices(invoices.length);
          setPaidInvoices(paidInvoicesCount);
          setPendingInvoices(pendingInvoicesCount);
        }
      });
  }, []);  // ✅ Removed dependencies to prevent unnecessary re-renders

  const getCSV = async () => {
    let student = JSON.parse(localStorage.getItem('student'));
      const res = await fetch("http://localhost:3000/api/invoice/csv", {                                              
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ student }),
      });
      const data = await res.json();
      if (data.success) {
        const link = document.createElement('a');
        link.href = "data:text/csv;charset=utf-8," + escape(data.csv);
        link.download = 'invoice.csv';
        link.click();
        toast.success(
          'CSV Downloaded Successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } else {
        toast.error(
          data.errors[0].msg, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        })
      }
    };

  // const handlePayment = async (invoice) => {
  //   if (!invoice || !invoice.amount) {
  //     console.error("Error: Invoice is undefined or missing amount");
  //     alert("Something went wrong. Please try again.");
  //     return;
  //   }

  //   // ✅ Remove ₹ symbol and extract numeric amount
  //   const amount = Number(invoice.amount.replace("₹ ", ""));

  //   // ✅ Redirect user to the Stripe test checkout page
  //   // const stripeTestURL = "https://buy.stripe.com/test_fZecOm3UK6qFfCg28a";
  //   window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;

  //   // Add query parameters for tracking payments
  //   // const paymentURL = `${stripeTestURL}?amount=${amount}&studentId=${student._id}&invoiceId=${invoice._id}`;

  //   // window.location.href = paymentURL;
  // };












  return (
    <div className="w-full h-screen flex flex-col gap-5 items-center justify-center max-h-screen overflow-y-auto">
      <h1 className="text-white font-bold text-5xl">Invoices</h1>
      <p className="text-white text-xl text-center px-5 sm:p-0">
        All the invoices like Mess bills, Hostel fee will be shown here
      </p>
      {/* <div className="flex gap-10 items-center my-5">
        <div className="flex flex-col items-center justify-center">
          <dt className="mb-2 ml-2 text-5xl font-extrabold text-blue-700">{totalInvoices}</dt>
          <dd className="text-gray-400 text-center">Total Invoices</dd>
        </div>
        <div className="flex flex-col items-center justify-center">
          <dt className="mb-2 text-5xl font-extrabold text-blue-700">{paidInvoices}</dt>
          <dd className="text-gray-400 ">
            Paid Invoices
          </dd>
        </div>
        <div className="flex flex-col items-center justify-center">
          <dt className="mb-2 text-5xl font-extrabold text-blue-700">{pendingInvoices}</dt>
          <dd className="text-gray-400">
            Pending Invoices
          </dd>
        </div>
      </div> */}

      <div className="w-full max-w-md p-4 border rounded-lg shadow sm:p-8 bg-neutral-950 border-neutral-900 drop-shadow-xl overflow-y-auto max-h-70">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-xl font-bold leading-none text-white">
            Latest Invoices
          </h5>
        </div>
        <div className="flow-root">
          <ul role="list" className="divide-y divide-gray-700">
            {invoiceList.map((invoice, index) => (
              <li className="py-3 sm:py-4" key={invoice._id || `invoice-${index}`}>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">{invoice.title}</p>
                    <p className="text-sm truncate text-gray-400">{invoice.date}</p>
                  </div>
                  <div className="flex flex-col items-center text-base font-semibold text-white">
                    {invoice.amount}
                  </div>
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded"
                      onClick={getCSV} // ✅ Correct function for downloading
                      target="_blank"
                      download={true}
                    >
                      Download Invoice
                    </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}

export default Invoices;
