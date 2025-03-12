import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const CheckoutPage = () => {
    const { studentId, paymentAmount } = useParams();
    const navigate = useNavigate();
    console.log(studentId)
    console.log(paymentAmount)
    
    // Form State
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'upi'
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [cardHolder, setCardHolder] = useState("");
    const [upiId, setUpiId] = useState("");
    const [error, setError] = useState("");

    
    // setAmount(paymentAmount);
    // Validation functions
    const validateCardNumber = (num) => /^[0-9]{16}$/.test(num);
    const validateExpiry = (date) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(date);
    const validateCvv = (cvv) => /^[0-9]{3}$/.test(cvv);
    const validateUpiId = (id) => /^[\w.-]+@\w+$/.test(id); // Basic UPI ID validation

    const handlePayment = async (e) => {
        e.preventDefault();
        setError("");

        // Common validation
        if (Number(paymentAmount) <= 0) {
            setError("Amount must be greater than zero.");
            return;
        }

        // Payment method specific validation
        if (paymentMethod === 'card') {
            if (!validateCardNumber(cardNumber.replace(/\s/g, ''))) {
                setError("Invalid card number! Must be 16 digits.");
                return;
            }
            if (!validateExpiry(expiry)) {
                setError("Invalid expiry date! Use MM/YY format.");
                return;
            }
            if (!validateCvv(cvv)) {
                setError("Invalid CVV! Must be 3 digits.");
                return;
            }
            if (!cardHolder.trim()) {
                setError("Cardholder name is required.");
                return;
            }
        } else if (paymentMethod === 'upi') {
            if (!validateUpiId(upiId)) {
                setError("Invalid UPI ID! Format: example@bank");
                return;
            }
        }

        try {
            // Simulate API call
            const isPaymentSuccessful = true;
        
            if (isPaymentSuccessful) {
                const response = await fetch("http://localhost:3000/api/payments/generate-invoice", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ studentId, amount: paymentAmount })
                });
        
                const data = await response.json();
        
                if (response.ok && data.success) {
                    navigate(`/student-dashboard/invoices/`);
                } else {
                    setError(data.message || "Error generating invoice. Please try again.");
                }
            } else {
                setError("Payment failed! Please try again.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen p-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header with Back Button */}
                <div className="mb-8">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                    >
                        <svg 
                            className="w-5 h-5 mr-1" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                            />
                        </svg>
                        Back to Payments
                    </button>
                    
                    <div className="text-center mt-4">
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-2">
                            Checkout
                        </h1>
                        <p className="text-gray-400">Complete your purchase securely</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-800/30 text-red-400 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Payment Method Tabs */}
                {/* <div className="flex mb-6 border-b border-gray-700">
                    <button
                        className={`px-6 py-3 font-medium ${
                            paymentMethod === 'card' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                        onClick={() => setPaymentMethod('card')}
                    >
                        Credit/Debit Card
                    </button>
                    <button
                        className={`px-6 py-3 font-medium ${
                            paymentMethod === 'upi' 
                            ? 'text-indigo-400 border-b-2 border-indigo-400' 
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                        onClick={() => setPaymentMethod('upi')}
                    >
                        UPI
                    </button>
                </div> */}

                <form onSubmit={handlePayment} className="flex flex-col lg:flex-row gap-8">
                    {/* Payment Form */}
                    <div className="lg:w-2/3 bg-gray-800 rounded-xl p-6 shadow-xl">
                        <h2 className="text-xl font-semibold text-gray-200 mb-6">
                            {paymentMethod === 'card' ? 'Card Details' : 'UPI Details'}
                        </h2>
                        
                        {paymentMethod === 'card' ? (
                            <div className="space-y-6">
                                {/* Card Number */}
                                <div>
                                    <label className="block text-gray-400 mb-2">Card Number</label>
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                        placeholder="4242 4242 4242 4242"
                                        className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                {/* Expiry and CVV */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-gray-400 mb-2">Expiry Date</label>
                                        <input
                                            type="text"
                                            value={expiry}
                                            onChange={(e) => setExpiry(e.target.value
                                                .replace(/^(\d\d)(\d)$/, "$1/$2")
                                                .replace(/^(\d{2}\/\d{2}).*/, "$1")
                                            )}
                                            placeholder="MM/YY"
                                            className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-2">CVV</label>
                                        <input
                                            type="text"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                            placeholder="123"
                                            className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Cardholder Name */}
                                <div>
                                    <label className="block text-gray-400 mb-2">Cardholder Name</label>
                                    <input
                                        type="text"
                                        value={cardHolder}
                                        onChange={(e) => setCardHolder(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* UPI ID */}
                                <div>
                                    <label className="block text-gray-400 mb-2">UPI ID</label>
                                    <input
                                        type="email"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                                        placeholder="yourname@bank"
                                        className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div className="text-gray-400 text-sm">
                                    <p>You'll be redirected to your UPI app to complete the payment</p>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className={`w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg`}
                        >
                            Pay
                        </button>
                    </div>

                </form>

                {/* Security Info */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>Secure SSL Encryption</span>
                    </div>
                    <p>All transactions are secured with 256-bit encryption</p>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;