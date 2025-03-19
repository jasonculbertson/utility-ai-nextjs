import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import axios from 'axios';
import FormData from 'form-data';

/**
 * Extract pages from a PDF file and save them as individual PDFs
 */
export async function extractPdfPages(pdfPath: string, outputDir: string): Promise<string[]> {
  // Read the PDF file
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  
  console.log(`PDF has ${pageCount} pages. Extracting...`);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const pageFilePaths: string[] = [];
  
  // Extract each page to a separate PDF
  for (let i = 0; i < pageCount; i++) {
    const newPdfDoc = await PDFDocument.create();
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(copiedPage);
    
    const pageBytes = await newPdfDoc.save();
    const pageFilePath = path.join(outputDir, `page_${i + 1}.pdf`);
    
    fs.writeFileSync(pageFilePath, pageBytes);
    pageFilePaths.push(pageFilePath);
    
    console.log(`Extracted page ${i + 1}/${pageCount} to ${pageFilePath}`);
  }
  
  return pageFilePaths;
}

/**
 * Process a PDF page with OCR.space API
 */
export async function processPageWithOCR(pagePath: string, apiKey: string): Promise<any> {
  console.log(`Processing page with OCR: ${pagePath}`);
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(pagePath));
  
  try {
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
    
    return response.data;
  } catch (error) {
    console.error(`Error processing page with OCR: ${error}`);
    throw error;
  }
}

/**
 * Extract text from OCR result
 */
export function extractTextFromOCRResult(ocrResult: any): string {
  if (!ocrResult || !ocrResult.ParsedResults || ocrResult.ParsedResults.length === 0) {
    return '';
  }
  
  return ocrResult.ParsedResults.map((result: any) => result.ParsedText).join('\n');
}

/**
 * Process a PDF file with OCR.space API, extracting pages first
 */
export async function processPdfWithOCR(pdfPath: string, apiKey: string): Promise<string> {
  console.log(`Starting OCR processing of PDF: ${pdfPath}`);
  
  // Create a temporary directory for extracted pages
  const tempDir = path.join(path.dirname(pdfPath), 'temp_pages');
  
  try {
    // Extract pages from the PDF
    const pageFilePaths = await extractPdfPages(pdfPath, tempDir);
    
    let allText = '';
    
    // Process each page with OCR
    for (let i = 0; i < pageFilePaths.length; i++) {
      const pagePath = pageFilePaths[i];
      console.log(`Processing page ${i + 1}/${pageFilePaths.length}...`);
      
      // Process the page with OCR
      const ocrResult = await processPageWithOCR(pagePath, apiKey);
      
      // Extract text from OCR result
      const pageText = extractTextFromOCRResult(ocrResult);
      
      // Add page header and text to all text
      allText += `\n--- PAGE ${i + 1} ---\n${pageText}\n`;
    }
    
    console.log('OCR processing complete');
    return allText;
  } finally {
    // Clean up temporary files
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        fs.unlinkSync(path.join(tempDir, file));
      }
      fs.rmdirSync(tempDir);
    }
  }
}
