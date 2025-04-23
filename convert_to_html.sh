#!/bin/bash

# Check if Markdown file exists
if [ ! -f "Report.md" ]; then
  echo "Error: Report.md not found"
  exit 1
fi

# Create HTML header
cat > Report.html << EOL
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отчёт о внедрении мониторинга и логирования</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1, h2, h3 {
            color: #2c3e50;
        }
        h1 {
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        h2 {
            margin-top: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
        }
        pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        img {
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 5px;
            margin: 10px 0;
        }
        .screenshot-container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin: 20px 0;
        }
        .screenshot {
            flex: 1 1 300px;
            max-width: 450px;
        }
        .screenshot img {
            width: 100%;
        }
        .screenshot-caption {
            text-align: center;
            font-style: italic;
            margin-top: 5px;
        }
    </style>
</head>
<body>
EOL

# Convert Markdown to HTML
echo "<div class='markdown-body'>" >> Report.html

# Basic conversion of markdown to HTML (this is a very simplified approach)
cat Report.md | sed -E 's/^# (.*)/<h1>\1<\/h1>/g' \
| sed -E 's/^## (.*)/<h2>\1<\/h2>/g' \
| sed -E 's/^### (.*)/<h3>\1<\/h3>/g' \
| sed -E 's/^\*\*([^*]+)\*\*/<strong>\1<\/strong>/g' \
| sed -E 's/\*\*([^*]+)\*\*/<strong>\1<\/strong>/g' \
| sed -E 's/`([^`]+)`/<code>\1<\/code>/g' \
| sed -E 's/^- (.*)/<li>\1<\/li>/g' \
| sed -E 's/^[0-9]+\. (.*)/<li>\1<\/li>/g' \
| sed -E '/^<li>/i<ul>' \
| sed -E '/^<\/li>$/a<\/ul>' \
| sed -E 's/<\/ul>\n<ul>//g' \
| sed -E 's/^$/<p><\/p>/g' >> Report.html

echo "</div>" >> Report.html

# Add screenshots from the photos directory
echo "<h2>Приложение: Скриншоты</h2>" >> Report.html
echo "<div class='screenshot-container'>" >> Report.html

# List all PNG files in photos directory
for file in photos/*.png; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "<div class='screenshot'>" >> Report.html
    echo "  <img src='$file' alt='$filename' />" >> Report.html
    echo "  <div class='screenshot-caption'>$filename</div>" >> Report.html
    echo "</div>" >> Report.html
  fi
done

echo "</div>" >> Report.html

# Close HTML
cat >> Report.html << EOL
</body>
</html>
EOL

echo "HTML report created: Report.html"
chmod +x convert_to_html.sh 