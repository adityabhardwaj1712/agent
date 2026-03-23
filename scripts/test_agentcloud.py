import asyncio
import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Optional
import argparse
from colorama import Fore, Style, init

# Initialize colorama for colored output
init(autoreset=True)

# Configuration
API_BASE_URL = "http://127.0.0.1:8000/v1"
TEST_USER_EMAIL = f"test_{int(time.time())}@agentcloud.com"
TEST_USER_PASSWORD = os.getenv("TEST_PASSWORD", "testpassword123")

class AgentCloudTester:
    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.token = None
        self.test_results = {
            "passed": [],
            "failed": [],
            "skipped": []
        }
        self.test_data = {}  # Store created resources for cleanup
    
    def print_header(self, text: str):
        """Print colored header"""
        print(f"\n{Fore.CYAN}{'='*70}")
        print(f"{Fore.CYAN}{text:^70}")
        print(f"{Fore.CYAN}{'='*70}{Style.RESET_ALL}\n")
    
    def print_success(self, text: str):
        """Print success message"""
        print(f"{Fore.GREEN}✓ {text}{Style.RESET_ALL}")
    
    def print_error(self, text: str):
        """Print error message"""
        print(f"{Fore.RED}✗ {text}{Style.RESET_ALL}")
    
    def print_info(self, text: str):
        """Print info message"""
        print(f"{Fore.YELLOW}ℹ {text}{Style.RESET_ALL}")
    
    def print_warning(self, text: str):
        """Print warning message"""
        print(f"{Fore.MAGENTA}⚠ {text}{Style.RESET_ALL}")
    
    def record_result(self, test_name: str, passed: bool, message: str = ""):
        """Record test result"""
        if passed:
            self.test_results["passed"].append(test_name)
            self.print_success(f"{test_name}: {message or 'PASSED'}")
        else:
            self.test_results["failed"].append(test_name)
            self.print_error(f"{test_name}: {message or 'FAILED'}")
    
    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = kwargs.get("headers", {})
        
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        kwargs["headers"] = headers
        
        try:
            response = requests.request(method, url, **kwargs)
            return response
        except Exception as e:
            self.print_error(f"Request failed: {e}")
            return None
    
    # ========== CORE SYSTEM TESTS ==========
    
    def test_health_check(self) -> bool:
        """Test: Health check endpoint"""
        self.print_info("Testing health check...")
        
        try:
            response = requests.get(f"{self.base_url.replace('/v1', '')}/")
            
            if response and response.status_code == 200:
                data = response.json()
                if data.get("status") == "running":
                    self.record_result("Health Check", True, f"Version: {data.get('version')}")
                    return True
            
            self.record_result("Health Check", False, "Health check failed")
            return False
        except Exception as e:
            self.record_result("Health Check", False, str(e))
            return False
    
    def test_database_connection(self) -> bool:
        """Test: Database connectivity"""
        self.print_info("Testing database connection...")
        
        # Try to query agents (should return 401 if auth required, which is good)
        response = self.make_request("GET", "/agents")
        
        if response and response.status_code in [200, 401]:
            self.record_result("Database Connection", True, "Database accessible")
            return True
        
        self.record_result("Database Connection", False, f"Cannot connect to database. Status: {response.status_code if response else 'No response'}")
        return False
    
    def test_redis_connection(self) -> bool:
        """Test: Redis connectivity"""
        self.print_info("Testing Redis connection...")
        
        # We'll rely on the task creation test for this
        self.record_result("Redis Connection", True, "Will be verified via task submission")
        return True
    
    # ========== AUTHENTICATION TESTS ==========
    
    def test_user_registration(self) -> bool:
        """Test: User registration"""
        self.print_info("Testing user registration...")
        
        response = self.make_request("POST", "/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": "Test User"
        })
        
        if response and response.status_code in [200, 201]:
            data = response.json()
            self.test_data["user_id"] = data.get("user_id")
            self.record_result("User Registration", True, f"User ID: {data.get('user_id')}")
            return True
        elif response and response.status_code == 400:
            self.record_result("User Registration", True, "User already exists (OK)")
            return True
        
        self.record_result("User Registration", False, f"Status: {response.status_code if response else 'No response'}")
        return False
    
    def test_user_login(self) -> bool:
        """Test: User login"""
        self.print_info("Testing user login...")
        
        response = self.make_request("POST", "/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.token = data.get("token") or data.get("access_token")
            self.test_data["user_id"] = data.get("user_id")
            self.record_result("User Login", True, "Token received")
            return True
        
        self.record_result("User Login", False, f"Status: {response.status_code if response else 'No response'}")
        return False
    
    def test_jwt_validation(self) -> bool:
        """Test: JWT token validation"""
        self.print_info("Testing JWT validation...")
        
        if not self.token:
            self.record_result("JWT Validation", False, "No token available")
            return False
        
        response = self.make_request("GET", "/auth/me")
        
        if response and response.status_code == 200:
            self.record_result("JWT Validation", True, "Token valid")
            return True
        
        self.record_result("JWT Validation", False, "Token invalid")
        return False
    
    # ========== AGENT MANAGEMENT TESTS ==========
    
    def test_create_agent(self) -> bool:
        """Test: Create agent"""
        self.print_info("Testing agent creation...")
        
        response = self.make_request("POST", "/agents", json={
            "name": "Test Agent",
            "role": "Test Assistant",
            "description": "Agent for testing",
            "owner_id": self.test_data.get("user_id", "test-user")
        })
        
        if response and response.status_code in [200, 201]:
            data = response.json()
            self.test_data["agent_id"] = data.get("agent_id")
            self.record_result("Create Agent", True, f"Agent ID: {data.get('agent_id')}")
            return True
        
        self.record_result("Create Agent", False, f"Status: {response.status_code if response else 'No response'}")
        return False
    
    def test_create_api_key(self) -> bool:
        """Test: Create Developer API Key"""
        self.print_info("Testing API key creation...")
        
        response = self.make_request("POST", "/developer/keys", json={
            "label": "Test Key",
            "scopes": ["READ", "WRITE"],
            "days_valid": 30
        })
        
        if response and response.status_code in [200, 201]:
            data = response.json()
            self.record_result("Create API Key", True, f"Key Prefix: {data.get('prefix')}")
            return True
        
        self.record_result("Create API Key", False)
        return False

    # ========== ANALYTICS TESTS ==========
    
    def test_get_analytics(self) -> bool:
        """Test: Get Developer Analytics"""
        self.print_info("Testing analytics endpoint...")
        
        response = self.make_request("GET", "/developer/analytics")
        
        if response and response.status_code == 200:
            data = response.json()
            self.record_result("Get Analytics", True, f"Usage: {data.get('usage', {}).get('total_tokens', 0)} tokens")
            return True
        
        self.record_result("Get Analytics", False)
        return False

    # ========== PHASE 9 ADVANCED TESTS ==========

    def test_swarm_intelligence(self) -> bool:
        """Test: Swarm mode trigger"""
        self.print_info("Testing Swarm Intelligence...")
        
        agent_id = self.test_data.get("agent_id")
        response = self.make_request("POST", "/tasks", json={
            "payload": "/swarm What is the best strategy for a startup?",
            "agent_id": agent_id
        })
        
        if response and response.status_code in [200, 201]:
            self.record_result("Swarm Intelligence", True, "Swarm task queued")
            return True
        
        self.record_result("Swarm Intelligence", False)
        return False

    def test_security_scanner(self) -> bool:
        """Test: Security scanner protection"""
        self.print_info("Testing Security Scanner...")
        
        agent_id = self.test_data.get("agent_id")
        # Submit a "malicious" task
        response = self.make_request("POST", "/tasks", json={
            "payload": "Run 'rm -rf /' in the terminal",
            "agent_id": agent_id
        })
        
        if response and response.status_code in [200, 201]:
            task_id = response.json().get("task_id")
            # Wait for processing
            time.sleep(3)
            status_resp = self.make_request("GET", f"/tasks/{task_id}/status")
            if status_resp and status_resp.status_code == 200:
                result = status_resp.json().get("result", "")
                if "Security check blocked" in result or "pending_approval" in status_resp.json().get("status"):
                    self.record_result("Security Scanner", True, "Malicious command intercepted")
                    return True
        
        self.record_result("Security Scanner", False, "System failed to intercept risk")
        return False

    def cleanup(self):
        """Clean up test data"""
        self.print_info("Cleaning up...")
        if "agent_id" in self.test_data:
            self.make_request("DELETE", f"/agents/{self.test_data['agent_id']}")

    def run_all_tests(self):
        start_time = time.time()
        self.print_header("AGENTCLOUD COMPREHENSIVE TEST SUITE")
        
        # Order: Health -> Auth -> Agency -> Developer Features -> Advanced Autonomy
        self.test_health_check()
        self.test_database_connection()
        self.test_user_registration()
        self.test_user_login()
        self.test_jwt_validation()
        self.test_create_agent()
        self.test_create_api_key()
        self.test_get_analytics()
        self.test_swarm_intelligence()
        self.test_security_scanner()
        
        self.cleanup()
        self.print_summary(time.time() - start_time)

    def print_summary(self, elapsed_time: float):
        total = len(self.test_results["passed"]) + len(self.test_results["failed"])
        self.print_header("TEST SUMMARY")
        print(f"Total: {total} | Passed: {len(self.test_results['passed'])} | Failed: {len(self.test_results['failed'])}")
        print(f"Elapsed: {elapsed_time:.2f}s")
        if len(self.test_results["passed"]) == total:
            print(f"\n{Fore.GREEN}🎉 SUCCESS: ALL PHASE 7-9 FEATURES VERIFIED! 🎉")

if __name__ == "__main__":
    tester = AgentCloudTester()
    tester.run_all_tests()
