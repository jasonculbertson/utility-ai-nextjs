'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface EnergyData {
  kWh: number;
  rate: number;
  charge: number;
}

interface BillResult {
  serviceInfo: {
    customerName: string;
    serviceAddress: string;
    city: string;
    state: string;
    zip: string;
  };
  billingInfo: {
    billingPeriod: string;
    rateSchedule: string;
  };
  energyCharges: {
    peak: EnergyData;
    offPeak: EnergyData;
    total: number;
  };
  analysis: {
    currentPlan: string;
    currentPlanEstimatedCost: string;
    recommendedPlan: string;
    recommendedPlanEstimatedCost: string;
    potentialMonthlySavings: string;
    costByPlan: Array<{plan: string; cost: string}>;
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const [billData, setBillData] = useState<BillResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the bill data from localStorage
    const storedData = localStorage.getItem('billResult');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setBillData(parsedData);
      } catch (error) {
        console.error('Error parsing bill data:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleReset = () => {
    localStorage.removeItem('billResult');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!billData) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">No Bill Data Found</h1>
        <p className="mb-4">No bill data was found. Please upload a bill or enter details manually.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Go Back to Home
        </button>
      </div>
    );
  }

  const {
    serviceInfo,
    billingInfo,
    energyCharges,
    analysis
  } = billData;

  // Format currency
  const formatCurrency = (value: number | string) => {
    return `$${Number(value).toFixed(2)}`;
  };

  // Format rate
  const formatRate = (value: number) => {
    return `$${value.toFixed(5)}/kWh`;
  };

  // Format kWh
  const formatKwh = (value: number) => {
    return `${value.toFixed(3)} kWh`;
  };

  return (
    <div className="min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center">PG&E Bill Analysis Results</h1>
        
        {/* Service Information */}
        <div className="mb-8 p-6 border rounded-lg shadow-md bg-white">
          <h2 className="text-xl font-semibold mb-4">Service Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Customer Name:</p>
              <p className="font-medium">{serviceInfo.customerName}</p>
            </div>
            <div>
              <p className="text-gray-600">Service Address:</p>
              <p className="font-medium">{serviceInfo.serviceAddress}</p>
              <p className="font-medium">{serviceInfo.city}, {serviceInfo.state} {serviceInfo.zip}</p>
            </div>
          </div>
        </div>
        
        {/* Billing Information */}
        <div className="mb-8 p-6 border rounded-lg shadow-md bg-white">
          <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Billing Period:</p>
              <p className="font-medium">{billingInfo.billingPeriod}</p>
            </div>
            <div>
              <p className="text-gray-600">Rate Schedule:</p>
              <p className="font-medium">{billingInfo.rateSchedule}</p>
            </div>
          </div>
        </div>
        
        {/* Energy Charges */}
        <div className="mb-8 p-6 border rounded-lg shadow-md bg-white">
          <h2 className="text-xl font-semibold mb-4">Energy Charges</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Time Period</th>
                  <th className="py-3 px-6 text-right">Usage</th>
                  <th className="py-3 px-6 text-right">Rate</th>
                  <th className="py-3 px-6 text-right">Charge</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    <span className="font-medium">Peak</span>
                  </td>
                  <td className="py-3 px-6 text-right">{formatKwh(energyCharges.peak.kWh)}</td>
                  <td className="py-3 px-6 text-right">{formatRate(energyCharges.peak.rate)}</td>
                  <td className="py-3 px-6 text-right">{formatCurrency(energyCharges.peak.charge)}</td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    <span className="font-medium">Off-Peak</span>
                  </td>
                  <td className="py-3 px-6 text-right">{formatKwh(energyCharges.offPeak.kWh)}</td>
                  <td className="py-3 px-6 text-right">{formatRate(energyCharges.offPeak.rate)}</td>
                  <td className="py-3 px-6 text-right">{formatCurrency(energyCharges.offPeak.charge)}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="py-3 px-6 text-left whitespace-nowrap">
                    <span className="font-bold">Total</span>
                  </td>
                  <td className="py-3 px-6 text-right font-bold">
                    {formatKwh(energyCharges.peak.kWh + energyCharges.offPeak.kWh)}
                  </td>
                  <td className="py-3 px-6 text-right"></td>
                  <td className="py-3 px-6 text-right font-bold">{formatCurrency(energyCharges.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Rate Plan Analysis */}
        <div className="mb-8 p-6 border rounded-lg shadow-md bg-white">
          <h2 className="text-xl font-semibold mb-4">Rate Plan Analysis</h2>
          
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-600">Current Plan:</p>
                <p className="text-lg font-bold">{analysis.currentPlan}</p>
                <p className="text-gray-600 mt-1">Estimated Monthly Cost:</p>
                <p className="text-lg font-bold">{formatCurrency(analysis.currentPlanEstimatedCost)}</p>
              </div>
              
              <div>
                <p className="text-gray-600">Recommended Plan:</p>
                <p className="text-lg font-bold text-green-600">{analysis.recommendedPlan}</p>
                <p className="text-gray-600 mt-1">Estimated Monthly Cost:</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(analysis.recommendedPlanEstimatedCost)}</p>
              </div>
            </div>
            
            {Number(analysis.potentialMonthlySavings) > 0 && (
              <div className="p-3 bg-green-100 rounded-lg text-center">
                <p className="text-gray-700">Potential Monthly Savings:</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(analysis.potentialMonthlySavings)}</p>
                <p className="text-gray-700 mt-1">Potential Annual Savings:</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(Number(analysis.potentialMonthlySavings) * 12)}
                </p>
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-semibold mb-3">Cost Comparison by Rate Plan</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Rate Plan</th>
                  <th className="py-3 px-6 text-right">Estimated Monthly Cost</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {analysis.costByPlan.map((planCost, index) => (
                  <tr 
                    key={index} 
                    className={`border-b border-gray-200 hover:bg-gray-50 ${planCost.plan === analysis.recommendedPlan ? 'bg-green-50' : ''}`}
                  >
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <span className={`font-medium ${planCost.plan === analysis.recommendedPlan ? 'text-green-600' : ''}`}>
                        {planCost.plan}
                        {planCost.plan === analysis.currentPlan && ' (Current)'}
                        {planCost.plan === analysis.recommendedPlan && ' (Recommended)'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className={planCost.plan === analysis.recommendedPlan ? 'font-bold text-green-600' : ''}>
                        {formatCurrency(planCost.cost)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Rate Plan Descriptions */}
        <div className="mb-8 p-6 border rounded-lg shadow-md bg-white">
          <h2 className="text-xl font-semibold mb-4">Rate Plan Descriptions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold">E-1: Flat Rate (Tiered Pricing)</h3>
              <p className="text-gray-600">$0.31/kWh all day</p>
            </div>
            <div>
              <h3 className="font-bold">E-TOU-B: Time-of-Use (4-9pm Peak)</h3>
              <p className="text-gray-600">Winter: $0.42/kWh peak, $0.33/kWh off-peak</p>
            </div>
            <div>
              <h3 className="font-bold">E-TOU-C: Time-of-Use (4-9pm Peak)</h3>
              <p className="text-gray-600">Winter: $0.42/kWh peak, $0.33/kWh off-peak</p>
            </div>
            <div>
              <h3 className="font-bold">E-TOU-D: Time-of-Use (3-8pm Peak)</h3>
              <p className="text-gray-600">Winter: $0.40/kWh peak, $0.32/kWh off-peak</p>
              <p className="text-gray-600">Summer: $0.50/kWh peak, $0.35/kWh off-peak</p>
            </div>
            <div>
              <h3 className="font-bold">EV2-A: Time-of-Use (EV Owners)</h3>
              <p className="text-gray-600">Winter: $0.35/kWh peak, $0.27/kWh off-peak</p>
              <p className="text-gray-600">Summer: $0.47/kWh peak, $0.29/kWh off-peak</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={handleReset}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Process Another Bill
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Print Results
          </button>
        </div>
      </main>
    </div>
  );
}
