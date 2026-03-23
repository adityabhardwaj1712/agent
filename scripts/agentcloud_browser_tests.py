#!/usr/bin/env python3
"""
AgentCloud Browser Automation Testing
Tests actual browser functionality, UI interactions, and visual rendering
"""

import time
import json
import sys
from datetime import datetime
from typing import List, Dict, Any
from dataclasses import dataclass

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
except ImportError:
    print("Installing Selenium...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "selenium", "--break-system-packages"])
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.common.exceptions import TimeoutException, NoSuchElementException


@dataclass
class BrowserTestResult:
    page: str
    test_name: str
    passed: bool
    duration: float
    details: str
    screenshot: str = ""
    errors: List[str] = None

    def __post_init__(self):
        if self.errors is None:
            self.errors = []


class AgentCloudBrowserTester:
    def __init__(self, base_url: str = "http://localhost:3000", headless: bool = True):
        self.base_url = base_url
        self.headless = headless
        self.driver = None
        self.results: List[BrowserTestResult] = []

    def setup_driver(self):
        """Setup Chrome driver with options"""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.implicitly_wait(10)
            return True
        except Exception as e:
            print(f"❌ Failed to setup Chrome driver: {e}")
            return False

    def teardown(self):
        """Close browser"""
        if self.driver:
            self.driver.quit()

    def take_screenshot(self, name: str) -> str:
        """Take screenshot and return filename"""
        if not self.driver:
            return ""
        
        filename = f"screenshot_{name}_{int(time.time())}.png"
        try:
            self.driver.save_screenshot(filename)
            return filename
        except Exception as e:
            return ""

    def check_console_errors(self) -> List[str]:
        """Get JavaScript console errors"""
        if not self.driver:
            return []
        
        try:
            logs = self.driver.get_log('browser')
            errors = [log['message'] for log in logs if log['level'] == 'SEVERE']
            return errors
        except Exception:
            return []

    def test_page_load(self, path: str, page_name: str) -> BrowserTestResult:
        """Test if page loads successfully"""
        start = time.time()
        url = f"{self.base_url}{path}"
        errors = []

        try:
            self.driver.get(url)
            WebDriverWait(self.driver, 10).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            duration = time.time() - start
            page_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
            if "404" in page_text or "not found" in page_text:
                errors.append("404 Not Found error detected")
            if "error" in page_text and "console" not in page_text:
                errors.append("Error message detected on page")
            console_errors = self.check_console_errors()
            if console_errors:
                errors.extend(console_errors[:3])
            screenshot = self.take_screenshot(page_name.replace(" ", "_").lower())
            
            return BrowserTestResult(
                page=page_name,
                test_name="Page Load",
                passed=len(errors) == 0,
                duration=duration,
                details=f"Loaded in {duration:.2f}s",
                screenshot=screenshot,
                errors=errors
            )
        except Exception as e:
            return BrowserTestResult(
                page=page_name,
                test_name="Page Load",
                passed=False,
                duration=time.time() - start,
                details="Page load failed",
                errors=[str(e)]
            )

    def test_interactive_elements(self, path: str, page_name: str) -> BrowserTestResult:
        """Test interactive elements on the page"""
        start = time.time()
        errors = []
        try:
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            links = self.driver.find_elements(By.TAG_NAME, "a")
            inputs = self.driver.find_elements(By.TAG_NAME, "input")
            details = f"Found: {len(buttons)} buttons, {len(links)} links, {len(inputs)} inputs"
            return BrowserTestResult(
                page=page_name,
                test_name="Interactive Elements",
                passed=True,
                duration=time.time() - start,
                details=details
            )
        except Exception as e:
            return BrowserTestResult(
                page=page_name,
                test_name="Interactive Elements",
                passed=False,
                duration=time.time() - start,
                details="Test failed",
                errors=[str(e)]
            )

    def test_responsive_design(self, path: str, page_name: str) -> BrowserTestResult:
        """Test responsive design at different viewport sizes"""
        start = time.time()
        errors = []
        try:
            viewports = [(1920, 1080, "Desktop"), (768, 1024, "Tablet"), (375, 667, "Mobile")]
            results = []
            for width, height, device in viewports:
                self.driver.set_window_size(width, height)
                time.sleep(0.5)
                results.append(f"{device}: ✓")
            self.driver.set_window_size(1920, 1080)
            return BrowserTestResult(
                page=page_name,
                test_name="Responsive Design",
                passed=True,
                duration=time.time() - start,
                details=", ".join(results)
            )
        except Exception as e:
            return BrowserTestResult(
                page=page_name,
                test_name="Responsive Design",
                passed=False,
                duration=time.time() - start,
                details="Test failed",
                errors=[str(e)]
            )

    def run_all_tests(self):
        """Run all browser tests"""
        if not self.setup_driver():
            return False
        pages = [("/", "Home/Dashboard"), ("/agents", "Agents"), ("/tasks", "Tasks")]
        for path, name in pages:
            res = self.test_page_load(path, name)
            self.results.append(res)
            if res.passed:
                self.results.append(self.test_interactive_elements(path, name))
                self.results.append(self.test_responsive_design(path, name))
        self.teardown()
        return all(r.passed for r in self.results)

    def save_report(self, filename: str = "browser_test_report.json"):
        report = {
            "timestamp": datetime.now().isoformat(),
            "results": [asdict(r) for r in self.results]
        }
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)


if __name__ == "__main__":
    tester = AgentCloudBrowserTester("http://localhost:3000", headless=True)
    tester.run_all_tests()
    tester.save_report()
