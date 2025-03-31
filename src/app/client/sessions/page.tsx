export default function ClientSessions() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Sessions</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-blue-600">Sessions Overview</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Book New Session
            </button>
          </div>

          <div className="space-y-6">
            {/* Upcoming Session */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Session</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Coach Sarah Wilson</p>
                    <p className="text-sm text-gray-600">Tomorrow at 2:00 PM</p>
                    <p className="text-sm text-gray-600 mt-2">Focus: Goal Setting and Progress Review</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">Join</button>
                    <button className="text-gray-600 hover:text-gray-800">Reschedule</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Past Sessions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Past Sessions</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Coach Sarah Wilson</p>
                      <p className="text-sm text-gray-600">March 20, 2024</p>
                      <p className="text-sm text-gray-600 mt-2">Focus: Initial Assessment</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">View Notes</button>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Coach Sarah Wilson</p>
                      <p className="text-sm text-gray-600">March 13, 2024</p>
                      <p className="text-sm text-gray-600 mt-2">Focus: Progress Check</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">View Notes</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 