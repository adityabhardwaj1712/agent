import os
import re

def check_files(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                    if "List[" in content and "from typing import" not in content and "import typing" not in content:
                         if "from __future__ import annotations" not in content or "list[" not in content.lower():
                             print(f"MISSING List import: {path}")
                    
                    # Also check for datetime
                    if "datetime.datetime" in content and "import datetime" not in content:
                        print(f"MISSING datetime import: {path}")

if __name__ == "__main__":
    check_files(".")


