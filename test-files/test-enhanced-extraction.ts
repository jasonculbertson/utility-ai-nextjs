import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import { extractBillInfo } from '../src/lib/openai';

// Path to the PDF file
const pdfFilePath = path.join(__dirname, '../uploads/pge-bill.pdf');

// Function to extract pages from PDF
async function extractPdfPages(pdfFilePath: string): Promise<string[]> {
  try {
    console.log(`Extracting pages from PDF: ${pdfFilePath}`);
    const pdfBytes = fs.readFileSync(pdfFilePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF has ${pageCount} pages`);

    const outputDir = path.join(__dirname, '../uploads/pages');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const pageFiles: string[] = [];

    // Extract each page as a separate PDF
    for (let i = 0; i < Math.min(pageCount, 3); i++) { // Only process first 3 pages
      const newPdfDoc = await PDFDocument.create();
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
      newPdfDoc.addPage(copiedPage);

      const newPdfBytes = await newPdfDoc.save();
      const outputPath = path.join(outputDir, `page_${i + 1}.pdf`);
      fs.writeFileSync(outputPath, newPdfBytes);
      console.log(`Saved page ${i + 1} to ${outputPath}`);
      pageFiles.push(outputPath);
    }

    return pageFiles;
  } catch (error) {
    console.error('Error extracting PDF pages:', error);
    throw error;
  }
}

// Function to process PDF page with OCR.space API
async function processPageWithOCR(pdfFilePath: string) {
  try {
    console.log(`Processing PDF with OCR: ${pdfFilePath}`);
    
    // Create form data for OCR.space API
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(pdfFilePath);
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, path.basename(pdfFilePath));
    formData.append('apikey', process.env.OCR_SPACE_API_KEY || '');
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('filetype', 'pdf');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // More accurate OCR engine

    const response = await axios.post('https://api.ocr.space/parse/image', formData);

    if (response.data.IsErroredOnProcessing) {
      throw new Error(`OCR processing error: ${response.data.ErrorMessage}`);
    }

    return response.data;
  } catch (error) {
    console.error('Error processing PDF with OCR:', error);
    throw error;
  }
}

// Main function to test the enhanced extraction
async function testEnhancedExtraction() {
  try {
    // Extract pages from the PDF
    const pageFiles = await extractPdfPages(pdfFilePath);
    
    // Process each page with OCR
    const ocrResults = [];
    for (const pageFile of pageFiles) {
      const ocrResult = await processPageWithOCR(pageFile);
      ocrResults.push(ocrResult);
    }
    
    // Extract text from OCR results
    const pageTexts = ocrResults.map(result => {
      if (result.ParsedResults && result.ParsedResults.length > 0) {
        return result.ParsedResults[0].ParsedText;
      }
      return '';
    });
    
    console.log('\n--- OCR Text from Page 1 ---\n');
    console.log(pageTexts[0]);
    
    console.log('\n--- OCR Text from Page 3 ---\n');
    console.log(pageTexts[2]); // Page 3 (index 2) contains energy charges
    
    // Combine text from pages 1 and 3 for extraction
    const combinedText = pageTexts[0] + '\n\n' + pageTexts[2];
    
    // Use our enhanced extraction function
    console.log('\n--- Testing Enhanced Bill Info Extraction ---\n');
    const extractedInfo = await extractBillInfo(combinedText);
    
    console.log('\n--- Extracted Bill Information ---\n');
    console.log(JSON.stringify(extractedInfo, null, 2));
    
    return extractedInfo;
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testEnhancedExtraction();
