import React from 'react'
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe("pk_test_51PPelvSDfEhmeIXthofTBkrWoCSbX4nypxYdgnHEnYXy77iB3ZCW4W0J4Q27ab7MxZTRuz7GkvYPrNsGFrbYcHcH009uRb25Qf");

const handlePayment = async (invoiceId) => {
    const res = await fetch("http://localhost:3000/api/payment/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student._id, invoiceId })
    });

    const data = await res.json();
    if (data.success) {
        window.location.href = data.url; // ✅ Redirect to Stripe Checkout
    }
};

function Payments() {
  return (
    <h1>Payments are comming soon.....</h1>
  )
}

export default Payments