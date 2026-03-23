#!/usr/bin/env python3
"""
AgentCloud Master Test Runner
Runs all analysis and test scripts in sequence
"""

import subprocess
import sys
import os

SCRIPTS = [
    "doctor.py",
    "agentcloud_analyzer.py",
    "agentcloud_ui_analyzer.py",
    "agentcloud_test_suite.py",
    "test_full_suite.py"
]

def run_script(name):
    print(f"\n🚀 Running {name}...")
    try:
        path = os.path.join("scripts", name)
        subprocess.run([sys.executable, path], check=True)
        print(f"✅ {name} completed successfully")
    except Exception as e:
        print(f"❌ {name} failed: {e}")

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    for script in SCRIPTS:
        run_script(script)
