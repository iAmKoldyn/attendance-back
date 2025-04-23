#!/bin/bash

# Check if HTML file exists
if [ ! -f "Report.html" ]; then
  echo "Error: Report.html not found. Run ./convert_to_html.sh first."
  exit 1
fi

# Convert HTML to PDF
echo "Converting HTML to PDF..."
wkhtmltopdf --enable-local-file-access Report.html Report.pdf

# Check if conversion was successful
if [ $? -eq 0 ]; then
  echo "PDF report created: Report.pdf"
else
  echo "Error: Failed to create PDF"
  exit 1
fi 