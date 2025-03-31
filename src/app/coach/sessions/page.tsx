'use client';

export default function CoachSessions() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Sessions</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-emerald-600">Sessions Calendar</h2>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
              Schedule New Session
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Today's Sessions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-gray-600">2:00 PM - 3:00 PM</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-emerald-600 hover:text-emerald-800">Start</button>
                      <button className="text-gray-600 hover:text-gray-800">Reschedule</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Jane Smith</p>
                      <p className="text-sm text-gray-600">Tomorrow, 10:00 AM - 11:00 AM</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-gray-600 hover:text-gray-800">Reschedule</button>
                      <button className="text-red-600 hover:text-red-800">Cancel</button>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Mike Johnson</p>
                      <p className="text-sm text-gray-600">Friday, 3:00 PM - 4:00 PM</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-gray-600 hover:text-gray-800">Reschedule</button>
                      <button className="text-red-600 hover:text-red-800">Cancel</button>
                    </div>
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