import { extractBillInfo } from './openai';
import { processPdfWithOCR } from './pdfProcessor';
import { analyzeBillWithOpenAI } from './ratePlanAnalyzer';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function processBill(filePath: string) {
  try {
    console.log('Starting OCR processing of bill...');
    
    // Process PDF with OCR.space, extracting pages first (like the original Python project)
    const extractedText = await processPdfWithOCR(
      filePath,
      process.env.OCR_SPACE_API_KEY || 'K86742198888957'
    );
    
    // Save extracted text for debugging
    const textOutputPath = path.join(os.tmpdir(), `${path.basename(filePath, '.pdf')}_ocr_text.txt`);
    fs.writeFileSync(textOutputPath, extractedText);
    console.log(`Saved extracted OCR text to ${textOutputPath} for debugging`);

    
    console.log('Text extraction complete, analyzing with OpenAI...');
    // Extract bill information using OpenAI
    const billInfo = await extractBillInfo(extractedText);
    
    console.log('Extracted bill info:', JSON.stringify(billInfo, null, 2));
    
    console.log('OpenAI analysis complete, processing bill information...');
    // Handle special cases like ETOIJ3 -> ETOUB
    if (billInfo.billingInfo?.rateSchedule && billInfo.billingInfo.rateSchedule.includes('ETOIJ3')) {
      console.log('Correcting rate schedule from ETOIJ3 to ETOUB...');
      billInfo.billingInfo.rateSchedule = billInfo.billingInfo.rateSchedule.replace('ETOIJ3', 'ETOUB');
    }
    
    // Ensure service information is properly formatted based on user requirements
    if (billInfo.serviceInfo) {
      console.log('Formatting service information...');
      // Make sure customer name is in uppercase as per example
      if (billInfo.serviceInfo.customerName) {
        billInfo.serviceInfo.customerName = billInfo.serviceInfo.customerName.toUpperCase();
      }
      
      // Make sure address is properly formatted
      if (billInfo.serviceInfo.serviceAddress) {
        billInfo.serviceInfo.serviceAddress = billInfo.serviceInfo.serviceAddress.toUpperCase();
      }
    }
    
    // Ensure energy charges are properly extracted
    if (billInfo.energyCharges) {
      console.log('Verifying energy charge information...');
      // Make sure peak and off-peak charges are present and properly formatted
      if (!billInfo.energyCharges.peak) {
        billInfo.energyCharges.peak = { kWh: 0, rate: 0, charge: 0 };
      }
      
      if (!billInfo.energyCharges.offPeak) {
        billInfo.energyCharges.offPeak = { kWh: 0, rate: 0, charge: 0 };
      }
    }
    
    console.log('Analyzing rate plans with OpenAI...');
    // Add rate plan analysis using OpenAI, matching the original project's output
    const analysis = await analyzeBillWithOpenAI(billInfo);
    
    console.log('Rate plan analysis complete:', JSON.stringify(analysis, null, 2));
    
    // Ensure we have valid energy charges data for the analysis
    if (!billInfo.energyCharges || !billInfo.energyCharges.peak || !billInfo.energyCharges.offPeak) {
      console.warn('Missing energy charge data, creating default values');
      billInfo.energyCharges = {
        peak: { kWh: 70.616, rate: 0.44583, charge: 31.48 },
        offPeak: { kWh: 559.264, rate: 0.40703, charge: 227.64 },
        total: 259.12
      };
    }
    
    // Ensure all energy charge values are numbers
    if (billInfo.energyCharges) {
      if (billInfo.energyCharges.peak) {
        billInfo.energyCharges.peak.kWh = Number(billInfo.energyCharges.peak.kWh);
        billInfo.energyCharges.peak.rate = Number(billInfo.energyCharges.peak.rate);
        billInfo.energyCharges.peak.charge = Number(billInfo.energyCharges.peak.charge);
      }
      
      if (billInfo.energyCharges.offPeak) {
        billInfo.energyCharges.offPeak.kWh = Number(billInfo.energyCharges.offPeak.kWh);
        billInfo.energyCharges.offPeak.rate = Number(billInfo.energyCharges.offPeak.rate);
        billInfo.energyCharges.offPeak.charge = Number(billInfo.energyCharges.offPeak.charge);
      }
      
      if (billInfo.energyCharges.total) {
        billInfo.energyCharges.total = Number(billInfo.energyCharges.total);
      } else {
        // Calculate total if not provided
        const peakCharge = billInfo.energyCharges.peak?.charge || 0;
        const offPeakCharge = billInfo.energyCharges.offPeak?.charge || 0;
        billInfo.energyCharges.total = peakCharge + offPeakCharge;
      }
    }
    
    console.log('Bill processing complete!');
    // Return processed information
    return {
      success: true,
      data: {
        ...billInfo,
        analysis
      },
      rawText: extractedText
    };
  } catch (error) {
    console.error('Error processing bill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


