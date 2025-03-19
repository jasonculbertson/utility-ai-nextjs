import React from 'react';

export default function StaticInfoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">PG&E Bill Analyzer - Static Deployment</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>Note:</strong> This is a static deployment of the PG&E Bill Analyzer on GitHub Pages. 
          For full functionality including OCR processing and OpenAI integration, please run this application locally.
        </p>
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">Features (when run locally)</h2>
      <ul className="list-disc pl-6 mb-6">
        <li>Upload PG&E bills and extract key information using OCR and AI</li>
        <li>Manually enter bill details if you prefer not to upload your bill</li>
        <li>Compare your current rate plan with alternatives to find potential savings</li>
        <li>View detailed breakdown of energy charges and billing information</li>
      </ul>
      
      <h2 className="text-2xl font-semibold mb-4">Extracted Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border rounded p-4">
          <h3 className="text-xl font-medium mb-2">Service Information</h3>
          <ul className="list-disc pl-6">
            <li>Customer name (e.g., "JASON CULBERTSON")</li>
            <li>Service address (e.g., "1080 WARFIELD AVE")</li>
            <li>City, state, zip (e.g., "OAKLAND, CA 94610")</li>
          </ul>
        </div>
        
        <div className="border rounded p-4">
          <h3 className="text-xl font-medium mb-2">Billing Information</h3>
          <ul className="list-disc pl-6">
            <li>Billing period with billing days (e.g., "12/15/2022 - 01/15/2023 (31 billing days)")</li>
            <li>Rate schedule (e.g., "ETOUB Time of Use")</li>
          </ul>
        </div>
        
        <div className="border rounded p-4">
          <h3 className="text-xl font-medium mb-2">Energy Charges</h3>
          <ul className="list-disc pl-6">
            <li>Peak usage, rate, and charges</li>
            <li>Off-peak usage, rate, and charges</li>
            <li>Total charges</li>
          </ul>
        </div>
        
        <div className="border rounded p-4">
          <h3 className="text-xl font-medium mb-2">Rate Plan Analysis</h3>
          <ul className="list-disc pl-6">
            <li>Comparison of different rate plans</li>
            <li>Potential savings with alternative plans</li>
            <li>Recommendations based on your usage patterns</li>
          </ul>
        </div>
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">Local Setup Instructions</h2>
      <div className="bg-gray-50 p-4 rounded">
        <ol className="list-decimal pl-6">
          <li className="mb-2">Clone the repository: <code className="bg-gray-200 px-2 py-1 rounded">git clone https://github.com/jasonculbertson/utility-ai-nextjs.git</code></li>
          <li className="mb-2">Navigate to the project directory: <code className="bg-gray-200 px-2 py-1 rounded">cd utility-ai-nextjs</code></li>
          <li className="mb-2">Copy the example environment file: <code className="bg-gray-200 px-2 py-1 rounded">cp .env.example .env</code></li>
          <li className="mb-2">Edit the .env file to add your API keys:
            <ul className="list-disc pl-6 mt-2">
              <li><code className="bg-gray-200 px-2 py-1 rounded">OPENAI_API_KEY=your_openai_api_key</code></li>
              <li><code className="bg-gray-200 px-2 py-1 rounded">OCR_SPACE_API_KEY=your_ocr_space_api_key</code></li>
            </ul>
          </li>
          <li className="mb-2">Install dependencies: <code className="bg-gray-200 px-2 py-1 rounded">npm install</code></li>
          <li className="mb-2">Start the development server: <code className="bg-gray-200 px-2 py-1 rounded">npm run dev</code></li>
          <li>Open <a href="http://localhost:3000" className="text-blue-600 hover:underline">http://localhost:3000</a> in your browser</li>
        </ol>
      </div>
    </div>
  );
}
