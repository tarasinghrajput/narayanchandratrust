import { PropTypes } from "prop-types";

ReportModal.propTypes = {
  closeModal: PropTypes.func,
  suggestion: PropTypes.object,
};

function ReportModal({ closeModal, suggestion }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[100%] max-h-full flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-2xl max-h-full">
        <div className="relative rounded-lg shadow bg-gray-700">
          <div className="flex items-start justify-between p-4 border-b rounded-t border-gray-600">
            <h3 className="text-xl font-semibold text-white">
              Invoice Details - #{suggestion._id}
            </h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent rounded-lg text-sm p-1.5 ml-auto inline-flex items-center hover:bg-gray-600 hover:text-white"
              onClick={() => closeModal()}
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-gray-300">
              <div>
                <p className="font-medium">Student Name:</p>
                <p>{suggestion.student?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Amount:</p>
                <p>₹{suggestion.amount}</p>
              </div>
              <div>
                <p className="font-medium">Status:</p>
                <p className={`badge ${suggestion.status === 'paid' ? 'bg-green-500' : 'bg-red-500'} text-white px-2 py-1 rounded`}>
                  {suggestion.status}
                </p>
              </div>
              <div>
                <p className="font-medium">Due Date:</p>
                <p>{new Date(suggestion.date).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium">Invoice Title:</p>
                <p>{suggestion.title}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center p-6 space-x-2 border-t rounded-b border-gray-600">
            <button
              className="text-white focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-gray-600 hover:bg-gray-700"
              onClick={() => closeModal()}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;