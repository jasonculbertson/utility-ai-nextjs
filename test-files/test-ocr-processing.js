// Script to test OCR processing functionality
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function processPageWithOCR(pagePath, apiKey) {
  console.log(`Processing page with OCR: ${pagePath}`);
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(pagePath));
  
  try {
    console.log('Sending request to OCR.space API...');
    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: {
        ...formData.getHeaders(),
        'apikey': apiKey,
      },
      params: {
        'language': 'eng',
        'isOverlayRequired': 'false',
        'scale': 'true',
        'isTable': 'true',
        'OCREngine': '2'
      }
    });
    
    console.log('OCR request successful!');
    return response.data;
  } catch (error) {
    console.error(`Error processing page with OCR:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

function extractTextFromOCRResult(ocrResult) {
  if (!ocrResult || !ocrResult.ParsedResults || ocrResult.ParsedResults.length === 0) {
    return '';
  }
  
  return ocrResult.ParsedResults.map((result) => result.ParsedText).join('\n');
}

async function main() {
  if (process.argv.length < 3) {
    console.error('Please provide a path to a PDF page file');
    process.exit(1);
  }
  
  const pagePath = process.argv[2];
  if (!fs.existsSync(pagePath)) {
    console.error(`File not found: ${pagePath}`);
    process.exit(1);
  }
  
  // Use the fallback API key from your code or provide one as an argument
  const apiKey = process.argv[3] || process.env.OCR_SPACE_API_KEY || 'K86742198888957';
  
  try {
    console.log(`Using OCR.space API key: ${apiKey}`);
    const ocrResult = await processPageWithOCR(pagePath, apiKey);
    
    // Save the raw OCR result for debugging
    const resultPath = pagePath.replace('.pdf', '_ocr_result.json');
    fs.writeFileSync(resultPath, JSON.stringify(ocrResult, null, 2));
    console.log(`Saved raw OCR result to ${resultPath}`);
    
    // Extract and save the text
    const extractedText = extractTextFromOCRResult(ocrResult);
    const textPath = pagePath.replace('.pdf', '_ocr_text.txt');
    fs.writeFileSync(textPath, extractedText);
    console.log(`Saved extracted text to ${textPath}`);
    
    // Print a preview of the extracted text
    console.log('\nExtracted Text Preview:');
    console.log('------------------------');
    console.log(extractedText.substring(0, 500) + '...');
    
    // Check for specific energy charge details based on user requirements
    console.log('\nChecking for Energy Charges information:');
    const energyChargesRegex = /Energy Charges/i;
    const peakChargesRegex = /peak.*?([\d.]+)\s*kWh.*?\$(\d+\.\d+)/i;
    const offPeakChargesRegex = /Off\s*Peak.*?([\d.]+)\s*kWh.*?\$(\d+\.\d+)/i;
    
    if (energyChargesRegex.test(extractedText)) {
      console.log('✓ Found "Energy Charges" section');
    } else {
      console.log('✗ Could not find "Energy Charges" section');
    }
    
    const peakMatch = peakChargesRegex.exec(extractedText);
    if (peakMatch) {
      console.log(`✓ Found Peak charges: ${peakMatch[1]} kWh, $${peakMatch[2]}`);
    } else {
      console.log('✗ Could not find Peak charges');
    }
    
    const offPeakMatch = offPeakChargesRegex.exec(extractedText);
    if (offPeakMatch) {
      console.log(`✓ Found Off Peak charges: ${offPeakMatch[1]} kWh, $${offPeakMatch[2]}`);
    } else {
      console.log('✗ Could not find Off Peak charges');
    }
    
    // Check for service information
    console.log('\nChecking for Service Information:');
    const serviceForRegex = /Service For:\s*([^\n]+)/i;
    const serviceAddressRegex = /(\d+\s+[^,\n]+)/i;
    
    const serviceForMatch = serviceForRegex.exec(extractedText);
    if (serviceForMatch) {
      console.log(`✓ Found Service For: ${serviceForMatch[1]}`);
    } else {
      console.log('✗ Could not find Service For information');
    }
    
    const serviceAddressMatch = serviceAddressRegex.exec(extractedText);
    if (serviceAddressMatch) {
      console.log(`✓ Found Service Address: ${serviceAddressMatch[1]}`);
    } else {
      console.log('✗ Could not find Service Address');
    }
  } catch (error) {
    console.error('\nError processing OCR:', error.message);
  }
}

main();
