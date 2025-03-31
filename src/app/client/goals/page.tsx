export default function ClientGoals() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Goals</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-blue-600">Goals Overview</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Add New Goal
            </button>
          </div>

          <div className="space-y-6">
            {/* Active Goals */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Goals</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Improve Public Speaking Skills</h4>
                      <p className="text-sm text-gray-600 mt-1">Due: April 30, 2024</p>
                      <p className="text-sm text-gray-600 mt-2">Progress: 60%</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">Update</button>
                      <button className="text-green-600 hover:text-green-800">Complete</button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Develop Leadership Skills</h4>
                      <p className="text-sm text-gray-600 mt-1">Due: May 15, 2024</p>
                      <p className="text-sm text-gray-600 mt-2">Progress: 30%</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">Update</button>
                      <button className="text-green-600 hover:text-green-800">Complete</button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Goals */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Completed Goals</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg opacity-75">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Time Management Improvement</h4>
                      <p className="text-sm text-gray-600 mt-1">Completed: March 15, 2024</p>
                      <p className="text-sm text-gray-600 mt-2">Achievement: Successfully implemented daily planning routine</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">View Details</button>
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