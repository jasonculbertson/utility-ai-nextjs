'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManualEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Service Information
    customerName: '',
    serviceAddress: '',
    city: '',
    state: '',
    zip: '',
    
    // Billing Information
    billingPeriodStart: '',
    billingPeriodEnd: '',
    billingDays: '',
    rateSchedule: 'E-TOU-B',
    
    // Energy Charges
    peakKwh: '',
    peakRate: '',
    peakCharge: '',
    offPeakKwh: '',
    offPeakRate: '',
    offPeakCharge: '',
    totalCharges: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format the data to match the structure expected by the results page
      const formattedData = {
        serviceInfo: {
          customerName: formData.customerName,
          serviceAddress: formData.serviceAddress,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        },
        billingInfo: {
          billingPeriod: `${formData.billingPeriodStart} - ${formData.billingPeriodEnd} (${formData.billingDays} billing days)`,
          rateSchedule: `Rate Schedule: ${formData.rateSchedule}`
        },
        energyCharges: {
          peak: {
            kWh: parseFloat(formData.peakKwh),
            rate: parseFloat(formData.peakRate),
            charge: parseFloat(formData.peakCharge)
          },
          offPeak: {
            kWh: parseFloat(formData.offPeakKwh),
            rate: parseFloat(formData.offPeakRate),
            charge: parseFloat(formData.offPeakCharge)
          },
          total: parseFloat(formData.totalCharges)
        }
      };

      const response = await fetch('/api/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();

      if (result.success) {
        // Store the result in localStorage for the results page
        localStorage.setItem('billResult', JSON.stringify(result.data));
        router.push('/results');
      } else {
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Manual Bill Entry</h1>
        
        <div className="mb-8 p-6 border rounded-lg shadow-md bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Information Section */}
            <div className="p-4 border rounded bg-gray-50">
              <h2 className="text-xl font-semibold mb-4">Service Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Customer Name</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="e.g. JASON CULBERTSON"
                    className="border p-2 w-full rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Service Address</label>
                  <input
                    type="text"
                    name="serviceAddress"
                    value={formData.serviceAddress}
                    onChange={handleChange}
                    placeholder="e.g. 1080 WARFIELD AVE"
                    className="border p-2 w-full rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. OAKLAND"
                    className="border p-2 w-full rounded"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g. CA"
                      className="border p-2 w-full rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">ZIP</label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleChange}
                      placeholder="e.g. 94610"
                      className="border p-2 w-full rounded"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Information Section */}
            <div className="p-4 border rounded bg-gray-50">
              <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1">Billing Period Start</label>
                  <input
                    type="text"
                    name="billingPeriodStart"
                    value={formData.billingPeriodStart}
                    onChange={handleChange}
                    placeholder="MM/DD/YYYY"
                    className="border p-2 w-full rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Billing Period End</label>
                  <input
                    type="text"
                    name="billingPeriodEnd"
                    value={formData.billingPeriodEnd}
                    onChange={handleChange}
                    placeholder="MM/DD/YYYY"
                    className="border p-2 w-full rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Billing Days</label>
                  <input
                    type="number"
                    name="billingDays"
                    value={formData.billingDays}
                    onChange={handleChange}
                    placeholder="e.g. 30"
                    className="border p-2 w-full rounded"
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block mb-1">Rate Schedule</label>
                  <select
                    name="rateSchedule"
                    value={formData.rateSchedule}
                    onChange={handleChange}
                    className="border p-2 w-full rounded"
                    required
                  >
                    <option value="E-1">E-1: Flat Rate (Tiered Pricing)</option>
                    <option value="E-TOU-B">E-TOU-B: Time-of-Use (4-9pm Peak)</option>
                    <option value="E-TOU-C">E-TOU-C: Time-of-Use (4-9pm Peak)</option>
                    <option value="E-TOU-D">E-TOU-D: Time-of-Use (3-8pm Peak)</option>
                    <option value="EV2-A">EV2-A: Time-of-Use (EV Owners)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Energy Charges Section */}
            <div className="p-4 border rounded bg-gray-50">
              <h2 className="text-xl font-semibold mb-4">Energy Charges</h2>
              
              {/* Peak Charges */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Peak Charges</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1">Peak kWh</label>
                    <input
                      type="number"
                      step="0.000001"
                      name="peakKwh"
                      value={formData.peakKwh}
                      onChange={handleChange}
                      placeholder="e.g. 70.616000"
                      className="border p-2 w-full rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Peak Rate ($/kWh)</label>
                    <input
                      type="number"
                      step="0.00001"
                      name="peakRate"
                      value={formData.peakRate}
                      onChange={handleChange}
                      placeholder="e.g. 0.44583"
                      className="border p-2 w-full rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Peak Charge ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="peakCharge"
                      value={formData.peakCharge}
                      onChange={handleChange}
                      placeholder="e.g. 31.48"
                      className="border p-2 w-full rounded"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Off-Peak Charges */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Off-Peak Charges</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-1">Off-Peak kWh</label>
                    <input
                      type="number"
                      step="0.000001"
                      name="offPeakKwh"
                      value={formData.offPeakKwh}
                      onChange={handleChange}
                      placeholder="e.g. 559.264"
                      className="border p-2 w-full rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Off-Peak Rate ($/kWh)</label>
                    <input
                      type="number"
                      step="0.00001"
                      name="offPeakRate"
                      value={formData.offPeakRate}
                      onChange={handleChange}
                      placeholder="e.g. 0.40703"
                      className="border p-2 w-full rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Off-Peak Charge ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="offPeakCharge"
                      value={formData.offPeakCharge}
                      onChange={handleChange}
                      placeholder="e.g. 227.64"
                      className="border p-2 w-full rounded"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Total Charges */}
              <div>
                <label className="block mb-1">Total PG&E Electric Delivery Charges ($)</label>
                <input
                  type="number"
                  step="0.01"
                  name="totalCharges"
                  value={formData.totalCharges}
                  onChange={handleChange}
                  placeholder="e.g. 196.81"
                  className="border p-2 w-full rounded"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between">
              <a 
                href="/"
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Back to Home
              </a>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Analyze Bill'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
