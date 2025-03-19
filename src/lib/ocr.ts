import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export async function processImageWithOCR(imagePath: string, apiKey: string) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(imagePath));
  
  const response = await axios.post('https://api.ocr.space/parse/image', formData, {
    headers: {
      ...formData.getHeaders(),
      'apikey': apiKey,
    },
    params: {
      'language': 'eng',
      'isOverlayRequired': 'false',
    }
  });
  
  return response.data;
}

export function extractTextFromOCRResult(ocrResult: any) {
  const parsedResults = ocrResult.ParsedResults || [];
  return parsedResults.map((result: any) => result.ParsedText).join('\n');
}
