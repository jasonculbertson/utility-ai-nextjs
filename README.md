# PG&E Bill Analyzer

A Next.js application that extracts information from PG&E bills using OCR and OpenAI, analyzes rate plans, and recommends the most cost-effective options for users.

## Features

- **PG&E Bill Extraction**: Upload PG&E bills and extract key information using OCR and AI
- **Manual Entry**: Manually enter bill details if you prefer not to upload your bill
- **Rate Plan Analysis**: Compare your current rate plan with alternatives to find potential savings
- **Detailed Breakdown**: View detailed breakdown of energy charges and billing information

## Required Environment Variables

This application requires the following environment variables to function properly:

- `OPENAI_API_KEY`: Your OpenAI API key for extracting structured information from OCR text
- `OCR_SPACE_API_KEY`: Your OCR.space API key for processing PDF files to extract text via OCR

Copy the `.env.example` file to `.env` and add your API keys:

```bash
cp .env.example .env
# Then edit .env with your actual API keys
```

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Extraction Details

The application extracts the following information from PG&E bills:

### Service Information
- Customer name (e.g., "JASON CULBERTSON")
- Service address (e.g., "1080 WARFIELD AVE")
- City, state, zip (e.g., "OAKLAND, CA 94610")

### Billing Information
- Billing period with billing days (e.g., "12/15/2022 - 01/15/2023 (31 billing days)")
- Rate schedule (e.g., "ETOUB Time of Use")

### Energy Charges
- Peak usage, rate, and charges
- Off-peak usage, rate, and charges
- Total charges

## Deploy on Vercel

The easiest way to deploy this application is to use the [Vercel Platform](https://vercel.com/new).

**Important**: When deploying to Vercel, make sure to add the required environment variables in the Vercel dashboard under Project Settings > Environment Variables.
