// Simple script to test PDF processing functionality
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

async function extractPdfPages(pdfPath, outputDir) {
  console.log(`Starting PDF extraction from: ${pdfPath}`);
  console.log(`Output directory: ${outputDir}`);
  
  try {
    // Read the PDF file
    console.log('Reading PDF file...');
    const pdfBytes = fs.readFileSync(pdfPath);
    console.log(`PDF file size: ${pdfBytes.length} bytes`);
    
    // Load the PDF document
    console.log('Loading PDF document...');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF has ${pageCount} pages. Extracting...`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const pageFilePaths = [];
    
    // Extract each page to a separate PDF
    for (let i = 0; i < pageCount; i++) {
      console.log(`Processing page ${i + 1}/${pageCount}...`);
      const newPdfDoc = await PDFDocument.create();
      console.log('Copying page...');
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
      newPdfDoc.addPage(copiedPage);
      
      console.log('Saving page as PDF...');
      const pageBytes = await newPdfDoc.save();
      const pageFilePath = path.join(outputDir, `page_${i + 1}.pdf`);
      
      fs.writeFileSync(pageFilePath, pageBytes);
      pageFilePaths.push(pageFilePath);
      
      console.log(`Extracted page ${i + 1}/${pageCount} to ${pageFilePath}`);
    }
    
    console.log('PDF extraction complete!');
    return pageFilePaths;
  } catch (error) {
    console.error('Error during PDF extraction:', error);
    throw error;
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.error('Please provide a path to a PDF file');
    process.exit(1);
  }
  
  const pdfPath = process.argv[2];
  if (!fs.existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
  }
  
  const outputDir = path.join(path.dirname(pdfPath), 'extracted_pages');
  
  try {
    const pageFilePaths = await extractPdfPages(pdfPath, outputDir);
    console.log('\nExtracted pages:');
    pageFilePaths.forEach((filePath, index) => {
      console.log(`Page ${index + 1}: ${filePath}`);
    });
  } catch (error) {
    console.error('\nError processing PDF:', error);
  }
}

main();
