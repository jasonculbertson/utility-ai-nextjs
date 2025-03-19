import { NextResponse } from 'next/server';
import { extractBillInfo } from '../../../lib/openai';

// Sample OCR text from a PG&E bill
const sampleOcrText = `
PG&E
PACIFIC GAS AND ELECTRIC COMPANY

Account No: 1234567890-1
Statement Date: 01/15/2023
Due Date: 02/05/2023

Service For:
JASON CULBERTSON
1080 WARFIELD AVE
OAKLAND, CA 94610

Service Information
Service Agreement ID: 8765432109
Service Type: Electric
Rate Schedule: ETOIJ3 Time of Use

Billing Information
Billing Period: 12/15/2022 - 01/15/2023 (31 billing days)

Details of PG&E Electric Delivery Charges

Energy Charges
peak 70.616000 kWh @ $0.44583 $31.48
Off Peak 559.264000 kWh @ $0.40703 $227 E4

Total PG&E Electric Delivery Charges $259.12
`;

export async function GET() {
  try {
    console.log('Testing enhanced bill info extraction with sample OCR text...');
    console.log('Sample OCR text:', sampleOcrText);
    
    const extractedInfo = await extractBillInfo(sampleOcrText);
    
    console.log('Extracted Bill Information:');
    console.log(JSON.stringify(extractedInfo, null, 2));
    
    // Validation results
    const validationResults = {
      serviceInfo: {
        customerName: extractedInfo.serviceInfo.customerName === 'JASON CULBERTSON',
        serviceAddress: extractedInfo.serviceInfo.serviceAddress === '1080 WARFIELD AVE',
        city: extractedInfo.serviceInfo.city === 'OAKLAND',
        state: extractedInfo.serviceInfo.state === 'CA',
        zip: extractedInfo.serviceInfo.zip === '94610'
      },
      billingInfo: {
        billingPeriod: extractedInfo.billingInfo.billingPeriod === '12/15/2022 - 01/15/2023 (31 billing days)',
        rateSchedule: extractedInfo.billingInfo.rateSchedule.includes('ETOUB')
      },
      energyCharges: {
        peakKwh: Math.abs(extractedInfo.energyCharges.peak.kWh - 70.616) < 0.01,
        peakRate: Math.abs(extractedInfo.energyCharges.peak.rate - 0.44583) < 0.0001,
        peakCharge: Math.abs(extractedInfo.energyCharges.peak.charge - 31.48) < 0.01,
        offPeakKwh: Math.abs(extractedInfo.energyCharges.offPeak.kWh - 559.264) < 0.01,
        offPeakRate: Math.abs(extractedInfo.energyCharges.offPeak.rate - 0.40703) < 0.0001,
        offPeakCharge: Math.abs(extractedInfo.energyCharges.offPeak.charge - 227.64) < 0.01,
        total: Math.abs(extractedInfo.energyCharges.total - 259.12) < 0.01
      }
    };
    
    return NextResponse.json({
      extractedInfo,
      validationResults,
      success: true
    });
  } catch (error) {
    console.error('Error in test extraction:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
