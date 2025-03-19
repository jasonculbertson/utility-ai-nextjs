import { processPdfWithOCR } from '../lib/pdfProcessor';
import { extractBillInfo } from '../lib/openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPdfProcessing() {
  if (!process.argv[2]) {
    console.error('Please provide a path to a PDF file as an argument');
    process.exit(1);
  }

  const pdfPath = process.argv[2];
  if (!fs.existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
  }

  try {
    console.log(`Processing PDF: ${pdfPath}`);
    
    // Process the PDF with OCR
    const extractedText = await processPdfWithOCR(
      pdfPath,
      process.env.OCR_SPACE_API_KEY || 'K86742198888957'
    );
    
    // Save the extracted text to a file
    const textOutputPath = path.join(process.cwd(), `${path.basename(pdfPath, '.pdf')}_ocr_text.txt`);
    fs.writeFileSync(textOutputPath, extractedText);
    console.log(`Saved extracted OCR text to ${textOutputPath}`);
    
    // Extract bill information using OpenAI
    console.log('Analyzing text with OpenAI...');
    const billInfo = await extractBillInfo(extractedText);
    
    // Save the extracted bill information to a file
    const jsonOutputPath = path.join(process.cwd(), `${path.basename(pdfPath, '.pdf')}_extracted_data.json`);
    fs.writeFileSync(jsonOutputPath, JSON.stringify(billInfo, null, 2));
    console.log(`Saved extracted bill information to ${jsonOutputPath}`);
    
    // Print a summary of the extracted information
    console.log('\nExtracted Information Summary:');
    console.log('==============================');
    
    if (billInfo.serviceInfo) {
      console.log('Service Information:');
      console.log(`  Customer: ${billInfo.serviceInfo.customerName || 'Not found'}`);
      console.log(`  Address: ${billInfo.serviceInfo.serviceAddress || 'Not found'}`);
      console.log(`  Location: ${[billInfo.serviceInfo.city, billInfo.serviceInfo.state, billInfo.serviceInfo.zip].filter(Boolean).join(', ') || 'Not found'}`);
    }
    
    if (billInfo.billingInfo) {
      console.log('\nBilling Information:');
      console.log(`  Period: ${billInfo.billingInfo.billingPeriod || 'Not found'}`);
      console.log(`  Rate: ${billInfo.billingInfo.rateSchedule || 'Not found'}`);
    }
    
    if (billInfo.energyCharges) {
      console.log('\nEnergy Charges:');
      if (billInfo.energyCharges.peak) {
        console.log(`  Peak: ${billInfo.energyCharges.peak.kWh || 0} kWh @ $${billInfo.energyCharges.peak.rate || 0}/kWh = $${billInfo.energyCharges.peak.charge || 0}`);
      }
      if (billInfo.energyCharges.offPeak) {
        console.log(`  Off-Peak: ${billInfo.energyCharges.offPeak.kWh || 0} kWh @ $${billInfo.energyCharges.offPeak.rate || 0}/kWh = $${billInfo.energyCharges.offPeak.charge || 0}`);
      }
      console.log(`  Total: $${billInfo.energyCharges.total || 0}`);
    }
    
    // Now analyze the bill with OpenAI to get rate plan recommendations
    console.log('\nAnalyzing rate plans with OpenAI...');
    const { analyzeBillWithOpenAI } = await import('../lib/ratePlanAnalyzer');
    const analysis = await analyzeBillWithOpenAI(billInfo);
    
    // Save the analysis to a file
    const analysisOutputPath = path.join(process.cwd(), `${path.basename(pdfPath, '.pdf')}_rate_analysis.json`);
    fs.writeFileSync(analysisOutputPath, JSON.stringify(analysis, null, 2));
    console.log(`Saved rate plan analysis to ${analysisOutputPath}`);
    
    // Print the rate plan analysis
    console.log('\nRate Plan Analysis:');
    console.log('===================');
    
    if ('error' in analysis) {
      console.log(`Error: ${analysis.error}`);
    } else {
      console.log(`Current Plan: ${analysis.currentPlan} - ${analysis.currentPlanDescription}`);
      console.log(`Current Cost: $${analysis.currentCost.toFixed(2)}`);
      console.log(`
Best Plan: ${analysis.bestPlan} - ${analysis.bestPlanDescription}`);
      console.log(`Best Plan Cost: $${analysis.bestCost.toFixed(2)}`);
      console.log(`
Potential Savings:`);
      console.log(`  Monthly: $${analysis.monthlySavings.toFixed(2)}`);
      console.log(`  Yearly: $${analysis.yearlySavings.toFixed(2)}`);
      
      console.log('\nOpenAI Recommendation:');
      console.log('----------------------');
      console.log(analysis.recommendation);
      
      console.log('\nAll Rate Plans (Sorted by Cost):');
      console.log('-------------------------------');
      analysis.allPlans.forEach((plan, index) => {
        console.log(`${index + 1}. ${plan.planCode} - ${plan.description}`);
        console.log(`   Peak: $${plan.peakCost.toFixed(2)}, Off-Peak: $${plan.offPeakCost.toFixed(2)}, Total: $${plan.totalCost.toFixed(2)}`);
      });
    }
    
    console.log('\nProcessing complete!');
  } catch (error) {
    console.error('Error processing PDF:', error);
  }
}

testPdfProcessing();
