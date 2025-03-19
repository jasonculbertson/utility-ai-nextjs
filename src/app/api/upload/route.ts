import { NextRequest, NextResponse } from 'next/server';
import { processBill } from '@/lib/billProcessor';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  let filePath = '';
  
  try {
    console.log('Starting file upload process...');
    
    // Create a temporary directory for storing the uploaded file
    const tempDir = path.join(os.tmpdir(), 'pge-bill-uploads');
    if (!fs.existsSync(tempDir)) {
      console.log('Creating temporary directory for uploads...');
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Get the form data from the request
    console.log('Extracting form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file uploaded');
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check if the file is a PDF
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      console.error('Invalid file type uploaded:', file.name);
      return NextResponse.json(
        { success: false, error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Save the file to the temporary directory
    console.log('Saving uploaded file to temporary directory...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    filePath = path.join(tempDir, `${Date.now()}-${file.name}`);
    fs.writeFileSync(filePath, buffer);
    console.log('File saved successfully:', filePath);

    // Process the bill using the billProcessor
    console.log('Starting bill processing...');
    const result = await processBill(filePath);
    console.log('Bill processing complete');
    
    // Validate the extracted data to ensure all required fields are present
    if (result.success) {
      console.log('Validating extracted data...');
      const { data } = result;
      
      // Check for required service information (based on user requirements)
      if (!data.serviceInfo || !data.serviceInfo.customerName || !data.serviceInfo.serviceAddress) {
        console.warn('Missing service information in extracted data');
      }
      
      // Check for required billing information
      if (!data.billingInfo || !data.billingInfo.billingPeriod || !data.billingInfo.rateSchedule) {
        console.warn('Missing billing information in extracted data');
      }
      
      // Check for required energy charges
      if (!data.energyCharges || !data.energyCharges.peak || !data.energyCharges.offPeak) {
        console.warn('Missing energy charge information in extracted data');
      }
    }

    // Clean up the temporary file
    try {
      console.log('Cleaning up temporary file...');
      fs.unlinkSync(filePath);
      console.log('Temporary file deleted successfully');
    } catch (error) {
      console.error('Error deleting temporary file:', error);
    }

    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing upload:', error);
    
    // Clean up the temporary file if it exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up after processing failure:', cleanupError);
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

// Increase the request body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
