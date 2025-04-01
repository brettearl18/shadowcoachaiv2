import { DocumentDuplicateIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const TEMPLATE_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/template-id/edit#gid=0';

export default function TemplateSetupPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Check-in Template</h1>
          <p className="mt-2 text-sm text-gray-500">
            Follow these steps to set up a standardized check-in process for your clients.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">1. Get Your Template</h2>
            <p className="mt-2 text-sm text-gray-500">
              Make a copy of our standardized check-in template to get started.
            </p>
            <div className="mt-4">
              <a
                href={TEMPLATE_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <DocumentDuplicateIcon className="h-5 w-5 mr-2" />
                Copy Template
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">2. Share with Your Client</h2>
            <p className="mt-2 text-sm text-gray-500">
              Share the copied template with your client and ask them to fill it out regularly.
            </p>
            <div className="mt-4 space-y-4">
              <div className="bg-gray-50 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-900">Template Instructions for Clients</h3>
                <ul className="mt-2 text-sm text-gray-500 space-y-2">
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                    Fill out the check-in form at the agreed frequency (daily/weekly)
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                    Complete all required fields in the template
                  </li>
                  <li className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                    Add any additional notes or concerns in the comments section
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">3. Import Client Data</h2>
            <p className="mt-2 text-sm text-gray-500">
              Once your client has started filling out the template, you can easily import their data.
            </p>
            <div className="mt-4">
              <a
                href="/coach/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Need Help?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  If you have any questions about using the template or importing data, please contact our support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 