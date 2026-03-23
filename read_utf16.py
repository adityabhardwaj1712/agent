import sys

def read_utf16(path):
    try:
        with open(path, 'rb') as f:
            content = f.read().decode('utf-16')
            print(f"--- Content of {path} ---")
            print(content)
            print("-" * (len(path) + 18))
    except Exception as e:
        print(f"Error reading {path}: {e}")

if __name__ == "__main__":
    read_utf16("c:/Users/Aditya.Bhardwaj/Desktop/agent/missing.txt")
    read_utf16("c:/Users/Aditya.Bhardwaj/Desktop/agent/test_results.txt")
