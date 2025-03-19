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

// Import the OpenAI module using dynamic import
const importDynamic = new Function('modulePath', 'return import(modulePath)');

// We'll initialize this function after importing the module
let extractBillInfo;

// Test the enhanced extraction function
async function testExtraction() {
  try {
    // Dynamically import the OpenAI module
    console.log('Importing OpenAI module...');
    const openaiModule = await importDynamic('../src/lib/openai.ts');
    extractBillInfo = openaiModule.extractBillInfo;
    console.log('Successfully imported extractBillInfo function');
    
    console.log('Testing enhanced bill info extraction with sample OCR text...');
    
    const extractedInfo = await extractBillInfo(sampleOcrText);
    
    console.log('\nExtracted Bill Information:');
    console.log(JSON.stringify(extractedInfo, null, 2));
    
    // Validate the extracted information
    console.log('\nValidation Results:');
    
    // Check service info
    console.log('\nService Information:');
    console.log(`Customer Name: ${extractedInfo.serviceInfo.customerName}`);
    console.log(`Service Address: ${extractedInfo.serviceInfo.serviceAddress}`);
    console.log(`City: ${extractedInfo.serviceInfo.city}`);
    console.log(`State: ${extractedInfo.serviceInfo.state}`);
    console.log(`Zip: ${extractedInfo.serviceInfo.zip}`);
    
    // Check billing info
    console.log('\nBilling Information:');
    console.log(`Billing Period: ${extractedInfo.billingInfo.billingPeriod}`);
    console.log(`Rate Schedule: ${extractedInfo.billingInfo.rateSchedule}`);
    
    // Check energy charges
    console.log('\nEnergy Charges:');
    console.log(`Peak kWh: ${extractedInfo.energyCharges.peak.kWh}`);
    console.log(`Peak Rate: $${extractedInfo.energyCharges.peak.rate}/kWh`);
    console.log(`Peak Charge: $${extractedInfo.energyCharges.peak.charge}`);
    console.log(`Off-Peak kWh: ${extractedInfo.energyCharges.offPeak.kWh}`);
    console.log(`Off-Peak Rate: $${extractedInfo.energyCharges.offPeak.rate}/kWh`);
    console.log(`Off-Peak Charge: $${extractedInfo.energyCharges.offPeak.charge}`);
    console.log(`Total Energy Charges: $${extractedInfo.energyCharges.total}`);
    
    return extractedInfo;
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testExtraction();
