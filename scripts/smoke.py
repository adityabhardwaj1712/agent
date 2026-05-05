import requests
import time
import sys
import os

API_BASE_URL = os.getenv("API_BASE_URL", "http://api:8000")

def check_health():
    print(f"Checking health at {API_BASE_URL}...")
    for _ in range(10):
        try:
            response = requests.get(f"{API_BASE_URL}/health_check")
            if response.status_code == 200:
                print("AgentCloud is ONLINE!")
                return True
        except Exception as e:
            print(f"Waiting for API... {e}")
        time.sleep(5)
    return False

if __name__ == "__main__":
    if check_health():
        print("Smoke tests passed.")
        sys.exit(0)
    else:
        print("Smoke tests failed.")
        sys.exit(1)
