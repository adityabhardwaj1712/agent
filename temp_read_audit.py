import zipfile
import xml.etree.ElementTree as ET
import os

def read_docx(path):
    z = zipfile.ZipFile(path)
    doc_xml = z.read('word/document.xml')
    root = ET.fromstring(doc_xml)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    paragraphs = []
    for p in root.findall('.//w:p', ns):
        texts = [t.text for t in p.findall('.//w:t', ns) if t.text]
        if texts:
            paragraphs.append(''.join(texts))
    
    return '\n'.join(paragraphs)

if __name__ == '__main__':
    doc_path = r'c:\Users\Aditya.Bhardwaj\Downloads\AgentCloud_Full_Audit_Report.docx'
    content = read_docx(doc_path)
    with open(r'c:\Users\Aditya.Bhardwaj\Desktop\agent\temp_audit_content.txt', 'w', encoding='utf-8') as f:
        f.write(content)
