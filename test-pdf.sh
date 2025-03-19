#!/bin/bash

# Check if a PDF file was provided
if [ -z "$1" ]; then
  echo "Error: Please provide a path to a PDF file"
  echo "Usage: ./test-pdf.sh path/to/bill.pdf"
  exit 1
fi

# Run the test script with ts-node
npx ts-node src/scripts/test-pdf-processing.ts "$1"
