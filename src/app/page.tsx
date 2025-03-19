'use client';

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [activeTab, setActiveTab] = useState('upload-tab');
  const [processedBills, setProcessedBills] = useState<any[]>([]);
  const [showProcessedBills, setShowProcessedBills] = useState(false);
  const [isStaticDeployment, setIsStaticDeployment] = useState(false);
  const router = useRouter();
  
  // Check if this is a static deployment (GitHub Pages)
  useEffect(() => {
    // Check if API keys are missing or if we're on GitHub Pages domain
    const isStatic = typeof window !== 'undefined' && (
      !process.env.OPENAI_API_KEY || 
      !process.env.OCR_SPACE_API_KEY ||
      window.location.hostname.includes('github.io')
    );
    
    if (isStatic) {
      // Redirect to static info page
      router.push('/static-info');
    }
    
    setIsStaticDeployment(isStatic);
  }, [router]);

  // Form state for manual entry
  const [manualFormData, setManualFormData] = useState({
    billingStart: null as Date | null,
    billingEnd: null as Date | null,
    ratePlan: 'E-TOU-B',
    peakUsage: '',
    peakRate: '0.42',
    offPeakUsage: '',
    offPeakRate: '0.33',
    amountDue: ''
  });

  // Rate plan details
  const ratePlans = {
    'E-1': { peakRate: 0.31, offPeakRate: 0.31 },
    'E-TOU-B': { peakRate: 0.42, offPeakRate: 0.33 },
    'E-TOU-C': { peakRate: 0.42, offPeakRate: 0.33 },
    'E-TOU-D': { peakRate: 0.40, offPeakRate: 0.32 },
    'EV2-A': { peakRate: 0.35, offPeakRate: 0.27 }
  };

  // Update rate fields when plan changes
  const updateRateFields = (plan: string) => {
    const selectedPlan = plan as keyof typeof ratePlans;
    if (ratePlans[selectedPlan]) {
      setManualFormData(prev => ({
        ...prev,
        peakRate: ratePlans[selectedPlan].peakRate.toString(),
        offPeakRate: ratePlans[selectedPlan].offPeakRate.toString()
      }));
    }
  };

  // Handle manual form input changes
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setManualFormData(prev => ({ ...prev, [name]: value }));
    
    // Update rates when rate plan changes
    if (name === 'ratePlan') {
      updateRateFields(value);
    }
  };
  
  // Handle date changes
  const handleDateChange = (date: Date | null, fieldName: string) => {
    setManualFormData(prev => ({ ...prev, [fieldName]: date }));
  };

  // Handle PDF upload form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setProcessingStatus('Uploading file...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      // Simulate processing steps
      const processingSteps = [
        { step: 'ocr', message: 'Extracting text with OCR...' },
        { step: 'analyze', message: 'Analyzing bill data...' },
        { step: 'rate_analysis', message: 'Analyzing rate plans...' }
      ];
      
      for (const step of processingSteps) {
        if (!response.bodyUsed) {
          setProcessingStatus(step.message);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      const result = await response.json();
      
      if (result.success) {
        setProcessingStatus('Processing complete!');
        localStorage.setItem('billResult', JSON.stringify(result.data));
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Instead of redirecting, refresh the bill list
        refreshBillList();
      } else {
        setProcessingStatus('Error processing bill');
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error(error);
      setProcessingStatus('Error uploading file');
      alert('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual entry form submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates are selected
    if (!manualFormData.billingStart || !manualFormData.billingEnd) {
      alert('Please select both billing period start and end dates');
      return;
    }
    
    setLoading(true);
    
    try {
      // Format dates for API submission
      const formattedData = {
        ...manualFormData,
        billingStart: manualFormData.billingStart ? manualFormData.billingStart.toLocaleDateString('en-US') : '',
        billingEnd: manualFormData.billingEnd ? manualFormData.billingEnd.toLocaleDateString('en-US') : ''
      };
      
      const response = await fetch('/api/manual-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setProcessingStatus('Manual entry processed successfully!');
        // Refresh the bill list to show the new entry
        refreshBillList();
      } else {
        setProcessingStatus('Error processing manual entry');
        alert('Error: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error(error);
      setProcessingStatus('Error processing manual entry');
      alert('Error processing manual entry');
    } finally {
      setLoading(false);
    }
  };

  // Fetch processed bills
  const refreshBillList = async () => {
    try {
      // In a real app, this would fetch from an API endpoint
      // For now, we'll use mock data or localStorage
      const storedResult = localStorage.getItem('billResult');
      if (storedResult) {
        const parsedResult = JSON.parse(storedResult);
        setProcessedBills([{ data: parsedResult }]);
        setShowProcessedBills(true);
      }
    } catch (error) {
      console.error('Error fetching bill list:', error);
    }
  };

  // Load bills on initial render
  useEffect(() => {
    refreshBillList();
  }, []);

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">PG&E Bill Processor</h1>
        <p className="page-subtitle">Upload your PG&E bill or enter details manually to analyze potential savings</p>
      </div>
      
      <div className="card p-6 mb-8">
        {/* Tab Navigation */}
        <div className="tab-container mb-6">
          <button 
            className={`tab-button ${activeTab === 'upload-tab' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload-tab')}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload PG&E Bill
          </button>
          <button 
            className={`tab-button ${activeTab === 'manual-tab' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual-tab')}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Manual Entry
          </button>
        </div>
        
        <div id="upload-tab" className={`tab-content ${activeTab === 'upload-tab' ? 'active' : ''}`}>
          <div className="card p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Upload PG&E Bill</h2>
              <p className="text-gray">Upload your PG&E bill as a PDF to extract billing information and analyze potential savings.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="form-group">
                <div className="border border-dashed border-border rounded-md p-6 text-center mb-4 bg-secondary relative">
                  {file ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{file.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFile(null)}
                        className="text-gray hover:text-danger"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2">Drag and drop your PG&E bill here, or click to browse</p>
                      <p className="text-gray text-sm">Supports PDF files only</p>
                    </div>
                  )}
                  
                  {/* File input is only rendered when upload tab is active */}
                  {activeTab === 'upload-tab' && (
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      style={{ display: 'block', zIndex: 10 }}
                    />
                  )}
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!file || loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Upload and Process'}
              </button>
            </form>
            
            {/* Status Display */}
            {loading && (
              <div className="status-indicator status-processing">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium mb-1">Processing Bill</div>
                  <div className="text-sm">{processingStatus}</div>
                </div>
              </div>
            )}
            
            {!loading && processingStatus && (
              <div className="status-indicator status-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>{processingStatus}</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Manual Entry Tab Content */}
        <div id="manual-tab" className={`tab-content ${activeTab === 'manual-tab' ? 'active' : ''}`}>
          <div className="card p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Manual Bill Entry</h2>
              <p className="text-gray">Enter your PG&E bill details manually to analyze potential savings.</p>
            </div>
            
            <form onSubmit={handleManualSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-group">
                  <label htmlFor="billing-start" className="form-label">Billing Period Start</label>
                  <div className="relative">
                    <DatePicker
                      id="billing-start"
                      selected={manualFormData.billingStart}
                      onChange={(date) => handleDateChange(date, 'billingStart')}
                      className="form-input date-input"
                      dateFormat="MM/dd/yyyy"
                      placeholderText="Select start date"
                      required
                      wrapperClassName="date-picker-wrapper"
                    />
                    <div className="date-input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="billing-end" className="form-label">Billing Period End</label>
                  <div className="relative">
                    <DatePicker
                      id="billing-end"
                      selected={manualFormData.billingEnd}
                      onChange={(date) => handleDateChange(date, 'billingEnd')}
                      className="form-input date-input"
                      dateFormat="MM/dd/yyyy"
                      placeholderText="Select end date"
                      required
                      wrapperClassName="date-picker-wrapper"
                    />
                    <div className="date-input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-group mb-6">
                <label htmlFor="current-rate" className="form-label">Current Rate Plan</label>
                <select 
                  id="current-rate" 
                  name="ratePlan"
                  value={manualFormData.ratePlan}
                  onChange={handleManualInputChange}
                  className="form-input"
                  required
                >
                  <option value="E-1">E-1: Flat Rate (Tiered Pricing)</option>
                  <option value="E-TOU-B">E-TOU-B: Time-of-Use (4-9pm Peak)</option>
                  <option value="E-TOU-C">E-TOU-C: Time-of-Use (4-9pm Peak)</option>
                  <option value="E-TOU-D">E-TOU-D: Time-of-Use (3-8pm Peak)</option>
                  <option value="EV2-A">EV2-A: Time-of-Use (EV Owners)</option>
                </select>
              </div>
              
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3">Usage Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="peak-kwh" className="form-label">Peak kWh Usage</label>
                    <input 
                      type="number" 
                      id="peak-kwh" 
                      name="peakUsage"
                      value={manualFormData.peakUsage}
                      onChange={handleManualInputChange}
                      className="form-input"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="off-peak-kwh" className="form-label">Off-Peak kWh Usage</label>
                    <input 
                      type="number" 
                      id="off-peak-kwh" 
                      name="offPeakUsage"
                      value={manualFormData.offPeakUsage}
                      onChange={handleManualInputChange}
                      className="form-input"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3">Rate Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="peak-rate" className="form-label">Peak Rate ($/kWh)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray">$</span>
                      </div>
                      <input 
                        type="number" 
                        id="peak-rate" 
                        name="peakRate"
                        value={manualFormData.peakRate}
                        onChange={handleManualInputChange}
                        className="form-input pl-7"
                        step="0.00001"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="off-peak-rate" className="form-label">Off-Peak Rate ($/kWh)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray">$</span>
                      </div>
                      <input 
                        type="number" 
                        id="off-peak-rate" 
                        name="offPeakRate"
                        value={manualFormData.offPeakRate}
                        onChange={handleManualInputChange}
                        className="form-input pl-7"
                        step="0.00001"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-group mb-6">
                <label htmlFor="amount-due" className="form-label">Total Amount Due ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray">$</span>
                  </div>
                  <input 
                    type="number" 
                    id="amount-due" 
                    name="amountDue"
                    value={manualFormData.amountDue}
                    onChange={handleManualInputChange}
                    className="form-input pl-7"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Process Manual Entry'}
              </button>
            </form>
            
            {/* Status Display */}
            {loading && (
              <div className="status-indicator status-processing mt-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium mb-1">Processing Entry</div>
                  <div className="text-sm">{processingStatus}</div>
                </div>
              </div>
            )}
            
            {!loading && processingStatus && (
              <div className="status-indicator status-success mt-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>{processingStatus}</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Processed Bills Section */}
        {showProcessedBills && (
          <div className="card p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Processed Bills</h2>
                <p className="text-gray">View your analyzed bills and potential savings</p>
              </div>
              <div className="text-sm text-gray">
                {processedBills.length} {processedBills.length === 1 ? 'bill' : 'bills'} processed
              </div>
            </div>
            
            {processedBills.length === 0 ? (
              <div className="empty-state p-8 text-center">
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-md font-medium mb-2">No processed bills yet</h3>
                <p className="text-gray mb-4">Upload a bill or enter details manually to analyze potential savings</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-3 text-left text-sm font-medium text-gray">Customer</th>
                      <th className="p-3 text-left text-sm font-medium text-gray">Billing Period</th>
                      <th className="p-3 text-left text-sm font-medium text-gray">Current Rate</th>
                      <th className="p-3 text-left text-sm font-medium text-gray">Amount Due</th>
                      <th className="p-3 text-left text-sm font-medium text-gray">Suggested Rate</th>
                      <th className="p-3 text-left text-sm font-medium text-gray">Projected Amount</th>
                      <th className="p-3 text-left text-sm font-medium text-gray">Savings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedBills.map((bill, index) => {
                      const data = bill.data || {};
                      const isManualEntry = !data.customerName;
                      
                      return (
                        <tr key={index} className="border-b border-border hover:bg-hover transition-colors">
                          <td className="p-3">
                            <div className="flex items-center">
                              {isManualEntry ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              )}
                              <span>{isManualEntry ? 'Manual Entry' : data.customerName || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="p-3">{data.billingPeriod || 'N/A'}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {data.ratePlan || 'N/A'}
                            </span>
                          </td>
                          <td className="p-3 font-medium">${data.amountDue || 'N/A'}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {data.suggestedRatePlan || 'N/A'}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{data.projectedAmount ? `$${data.projectedAmount}` : 'N/A'}</td>
                          <td className="p-3">
                            {data.monthlySavings ? (
                              <div>
                                <div className="text-success font-medium">${data.monthlySavings}/mo</div>
                                <div className="text-xs text-gray">${data.yearlySavings}/yr</div>
                              </div>
                            ) : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
