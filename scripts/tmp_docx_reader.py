import zipfile
import xml.etree.ElementTree as ET
import os

def get_docx_text(path):
    if not os.path.exists(path):
        return f"File not found: {path}"
    try:
        with zipfile.ZipFile(path, 'r') as zip_ref:
            if 'word/document.xml' not in zip_ref.namelist():
                return f"Not a valid Word document: {path}"
            xml_content = zip_ref.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            text_parts = [t.text for t in tree.findall('.//w:t', ns) if t.text]
            return " ".join(text_parts)
    except Exception as e:
        return f"Error reading {path}: {str(e)}"

files = [
    r"c:\Users\Aditya.Bhardwaj\Downloads\AgentCloud_10on10_PowerUp_Guide.docx",
    r"c:\Users\Aditya.Bhardwaj\Downloads\AgentCloud_Technical_Review.docx",
    r"c:\Users\Aditya.Bhardwaj\Downloads\AgentCloud_Complete_Blueprint.docx"
]

with open(r"c:\Users\Aditya.Bhardwaj\Desktop\agent\docx_content.txt", "w", encoding="utf-8") as out:
    for f in files:
        out.write(f"--- {os.path.basename(f)} ---\n")
        out.write(get_docx_text(f) + "\n")
        out.write("="*50 + "\n\n")

print("Content written to docx_content.txt")
