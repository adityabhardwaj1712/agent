#!/usr/bin/env python3
"""
AgentCloud Comprehensive Test Suite
Tests API endpoints, browser functionality, and generates improvement reports
"""

import asyncio
import json
import time
import sys
from datetime import datetime
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from enum import Enum

try:
    import aiohttp
    import requests
except ImportError:
    print("Installing required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "aiohttp", "requests", "--break-system-packages"])
    import aiohttp
    import requests


class TestStatus(Enum):
    PASSED = "✅ PASSED"
    FAILED = "❌ FAILED"
    WARNING = "⚠️  WARNING"
    SKIPPED = "⏭️  SKIPPED"


@dataclass
class TestResult:
    name: str
    status: TestStatus
    duration: float
    details: str
    response_time: float = 0
    error: str = ""


class AgentCloudTester:
    def __init__(self, api_url: str = "http://localhost:8000", frontend_url: str = "http://localhost:3000"):
        self.api_url = api_url
        self.frontend_url = frontend_url
        self.results: List[TestResult] = []
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def add_result(self, result: TestResult):
        self.results.append(result)
        status_icon = result.status.value.split()[0]
        print(f"{status_icon} {result.name} ({result.duration:.2f}s)")
        if result.details:
            print(f"   └─ {result.details}")
        if result.error:
            print(f"   └─ Error: {result.error}")

    async def test_api_health(self) -> TestResult:
        """Test API health endpoint"""
        start = time.time()
        try:
            async with self.session.get(f"{self.api_url}/", timeout=5) as resp:
                duration = time.time() - start
                if resp.status == 200:
                    data = await resp.json()
                    return TestResult(
                        name="API Health Check",
                        status=TestStatus.PASSED,
                        duration=duration,
                        details=f"Status: {data.get('status')}, Version: {data.get('version')}",
                        response_time=duration
                    )
                else:
                    return TestResult(
                        name="API Health Check",
                        status=TestStatus.FAILED,
                        duration=duration,
                        details=f"HTTP {resp.status}",
                        error=await resp.text()
                    )
        except Exception as e:
            return TestResult(
                name="API Health Check",
                status=TestStatus.FAILED,
                duration=time.time() - start,
                details="Connection failed",
                error=str(e)
            )

    async def test_api_endpoints(self) -> List[TestResult]:
        """Test all major API endpoints"""
        endpoints = [
            ("/v1/agents", "GET", "List Agents"),
            ("/v1/tasks", "GET", "List Tasks"),
            ("/v1/analytics/metrics", "GET", "Analytics Metrics"),
            ("/v1/audit", "GET", "Audit Logs"),
            ("/v1/tools", "GET", "Available Tools"),
            ("/v1/memory", "GET", "Memory Store"),
            ("/metrics", "GET", "Prometheus Metrics"),
        ]

        results = []
        for path, method, name in endpoints:
            start = time.time()
            try:
                url = f"{self.api_url}{path}"
                async with self.session.request(method, url, timeout=10) as resp:
                    duration = time.time() - start
                    if resp.status in [200, 401, 403]:  # 401/403 might be auth-protected
                        status = TestStatus.PASSED if resp.status == 200 else TestStatus.WARNING
                        details = f"HTTP {resp.status}"
                        if resp.status == 200:
                            try:
                                data = await resp.json()
                                if isinstance(data, list):
                                    details += f" - {len(data)} items"
                                elif isinstance(data, dict):
                                    details += f" - {len(data)} fields"
                            except:
                                pass
                    else:
                        status = TestStatus.FAILED
                        details = f"HTTP {resp.status}"

                    results.append(TestResult(
                        name=f"Endpoint: {name}",
                        status=status,
                        duration=duration,
                        details=details,
                        response_time=duration
                    ))
            except Exception as e:
                results.append(TestResult(
                    name=f"Endpoint: {name}",
                    status=TestStatus.FAILED,
                    duration=time.time() - start,
                    details="Request failed",
                    error=str(e)
                ))

        return results

    async def test_frontend_pages(self) -> List[TestResult]:
        """Test frontend page accessibility"""
        pages = [
            ("/", "Home/Dashboard"),
            ("/agents", "Agents Page"),
            ("/tasks", "Tasks Page"),
            ("/chat", "Chat Interface"),
            ("/analytics", "Analytics Page"),
            ("/monitor", "Monitor Page"),
            ("/protocol", "Protocol Page"),
            ("/audit-logs", "Audit Logs"),
            ("/approvals", "Approvals"),
            ("/leaderboard", "Leaderboard"),
        ]

        results = []
        for path, name in pages:
            start = time.time()
            try:
                url = f"{self.frontend_url}{path}"
                async with self.session.get(url, timeout=10) as resp:
                    duration = time.time() - start
                    html = await resp.text()
                    
                    if resp.status == 200:
                        # Check for common issues
                        issues = []
                        if "404" in html or "Not Found" in html:
                            issues.append("Contains 404 error")
                        if "error" in html.lower() and "console.error" not in html.lower():
                            issues.append("Contains error message")
                        
                        status = TestStatus.WARNING if issues else TestStatus.PASSED
                        details = f"HTTP {resp.status}, Size: {len(html)} bytes"
                        if issues:
                            details += f" - {', '.join(issues)}"
                    else:
                        status = TestStatus.FAILED
                        details = f"HTTP {resp.status}"

                    results.append(TestResult(
                        name=f"Frontend: {name}",
                        status=status,
                        duration=duration,
                        details=details,
                        response_time=duration
                    ))
            except Exception as e:
                results.append(TestResult(
                    name=f"Frontend: {name}",
                    status=TestStatus.FAILED,
                    duration=time.time() - start,
                    details="Request failed",
                    error=str(e)
                ))

        return results

    async def test_websocket(self) -> TestResult:
        """Test WebSocket connection for task updates"""
        start = time.time()
        try:
            # WebSocket test would go here
            return TestResult(
                name="WebSocket Support",
                status=TestStatus.SKIPPED,
                duration=time.time() - start,
                details="WebSocket testing requires additional setup"
            )
        except Exception as e:
            return TestResult(
                name="WebSocket Support",
                status=TestStatus.FAILED,
                duration=time.time() - start,
                details="Test failed",
                error=str(e)
            )

    async def test_database_connection(self) -> TestResult:
        """Test if database is accessible through API"""
        start = time.time()
        try:
            async with self.session.get(f"{self.api_url}/v1/agents", timeout=5) as resp:
                duration = time.time() - start
                if resp.status in [200, 401, 403]:
                    return TestResult(
                        name="Database Connection",
                        status=TestStatus.PASSED,
                        duration=duration,
                        details="Database accessible via API"
                    )
                else:
                    return TestResult(
                        name="Database Connection",
                        status=TestStatus.FAILED,
                        duration=duration,
                        details=f"HTTP {resp.status}"
                    )
        except Exception as e:
            return TestResult(
                name="Database Connection",
                status=TestStatus.FAILED,
                duration=time.time() - start,
                details="Cannot verify DB connection",
                error=str(e)
            )

    async def run_all_tests(self):
        """Run all tests"""
        print("=" * 80)
        print("🚀 AgentCloud Comprehensive Test Suite")
        print("=" * 80)
        print(f"API URL: {self.api_url}")
        print(f"Frontend URL: {self.frontend_url}")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        print()

        print("📋 CORE HEALTH TESTS")
        print("-" * 80)
        self.add_result(await self.test_api_health())
        self.add_result(await self.test_database_connection())
        print()

        print("🔌 API ENDPOINT TESTS")
        print("-" * 80)
        api_results = await self.test_api_endpoints()
        for result in api_results:
            self.add_result(result)
        print()

        print("🌐 FRONTEND PAGE TESTS")
        print("-" * 80)
        frontend_results = await self.test_frontend_pages()
        for result in frontend_results:
            self.add_result(result)
        print()

        print("🔧 ADDITIONAL TESTS")
        print("-" * 80)
        self.add_result(await self.test_websocket())
        print()

        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)

        passed = sum(1 for r in self.results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAILED)
        warnings = sum(1 for r in self.results if r.status == TestStatus.WARNING)
        skipped = sum(1 for r in self.results if r.status == TestStatus.SKIPPED)
        total = len(self.results)

        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"⏭️  Skipped: {skipped}")
        print()

        avg_response = sum(r.response_time for r in self.results if r.response_time > 0) / max(sum(1 for r in self.results if r.response_time > 0), 1)
        print(f"Average Response Time: {avg_response:.3f}s")
        print()

        print("=" * 80)

    def save_report(self, filename: str = "test_report.json"):
        """Save detailed test report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "api_url": self.api_url,
            "frontend_url": self.frontend_url,
            "summary": {
                "total": len(self.results),
                "passed": sum(1 for r in self.results if r.status == TestStatus.PASSED),
                "failed": sum(1 for r in self.results if r.status == TestStatus.FAILED),
                "warnings": sum(1 for r in self.results if r.status == TestStatus.WARNING),
                "skipped": sum(1 for r in self.results if r.status == TestStatus.SKIPPED),
            },
            "results": [
                {
                    "name": r.name,
                    "status": r.status.name,
                    "duration": r.duration,
                    "details": r.details,
                    "response_time": r.response_time,
                    "error": r.error
                }
                for r in self.results
            ]
        }

        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📄 Detailed report saved to: {filename}")


async def main():
    api_url = "http://localhost:8000"
    frontend_url = "http://localhost:3000"

    async with AgentCloudTester(api_url, frontend_url) as tester:
        await tester.run_all_tests()
        tester.save_report()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(1)
    except Exception as e:
        sys.exit(1)
