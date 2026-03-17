import zipfile
import os

def debug_docx(path):
    if not os.path.exists(path):
        return f"File not found: {path}"
    try:
        with zipfile.ZipFile(path, 'r') as zip_ref:
            nl = zip_ref.namelist()
            print(f"File: {os.path.basename(path)}")
            print(f"Files in ZIP: {nl[:10]}...")
            if 'word/document.xml' in nl:
                content = zip_ref.read('word/document.xml')
                print(f"Content preview (first 200 bytes): {content[:200]}")
            else:
                print("word/document.xml NOT FOUND")
    except Exception as e:
        print(f"Error debugging {path}: {str(e)}")

files = [
    r"c:\Users\Aditya.Bhardwaj\Downloads\AgentCloud_10on10_PowerUp_Guide.docx",
    r"c:\Users\Aditya.Bhardwaj\Downloads\AgentCloud_Technical_Review.docx"
]

for f in files:
    debug_docx(f)
    print("\n" + "="*50 + "\n")
