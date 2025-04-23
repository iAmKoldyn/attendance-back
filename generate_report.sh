#!/bin/bash

echo "=== Generating Monitoring and Logging Implementation Report ==="
echo

# Step 1: Convert Markdown to HTML
echo "Step 1: Converting Markdown to HTML..."
./convert_to_html.sh
if [ $? -ne 0 ]; then
  echo "Error: Failed to convert Markdown to HTML"
  exit 1
fi
echo

# Step 2: Generate PDF from HTML
echo "Step 2: Generating PDF from HTML..."
./generate_pdf.sh
if [ $? -ne 0 ]; then
  echo "Error: Failed to generate PDF"
  exit 1
fi
echo

# Step 3: Create a zip file with all report materials
echo "Step 3: Creating ZIP archive with all report materials..."
zip -r attendance_monitoring_report.zip Report.md Report.html Report.pdf photos/ process_explanation.md
if [ $? -ne 0 ]; then
  echo "Error: Failed to create ZIP archive"
  exit 1
fi
echo

echo "=== Report Generation Complete ==="
echo "The following files have been created:"
echo " - Report.md (Markdown format)"
echo " - Report.html (HTML format)"
echo " - Report.pdf (PDF format)"
echo " - attendance_monitoring_report.zip (Archive with all materials)"
echo
echo "You can find the complete report in Report.pdf" 