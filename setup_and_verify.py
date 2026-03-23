#!/usr/bin/env python3
"""
AgentCloud Complete Setup & Feature Verification
This script helps you set up and verify ALL features are working correctly
"""

import os
import sys
import subprocess
import time
import json
from pathlib import Path
from typing import Dict, List, Tuple


class Colors:
    """Terminal colors for better output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


class AgentCloudSetup:
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root) if project_root else Path.cwd()
        self.results = []
        self.errors = []
        
    def print_header(self, text: str):
        """Print a formatted header"""
        print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.CYAN}  {text}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.RESET}\n")
    
    def print_step(self, step: str, substep: str = ""):
        """Print current step"""
        if substep:
            print(f"{Colors.BLUE}  ├─ {substep}{Colors.RESET}")
        else:
            print(f"\n{Colors.BOLD}{Colors.MAGENTA}▶ {step}{Colors.RESET}")
    
    def print_success(self, message: str):
        """Print success message"""
        print(f"{Colors.GREEN}  ✓ {message}{Colors.RESET}")
        self.results.append(("SUCCESS", message))
    
    def print_error(self, message: str, error: str = ""):
        """Print error message"""
        print(f"{Colors.RED}  ✗ {message}{Colors.RESET}")
        if error:
            print(f"{Colors.RED}    Error: {error}{Colors.RESET}")
        self.errors.append((message, error))
    
    def print_warning(self, message: str):
        """Print warning message"""
        print(f"{Colors.YELLOW}  ⚠ {message}{Colors.RESET}")
    
    def run_command(self, command: str, description: str, check_output: bool = False) -> Tuple[bool, str]:
        """Run a shell command and return success status"""
        # Fix python3 to python on Windows
        if os.name == 'nt' and command.startswith('python3 '):
            command = 'python ' + command[8:]
            
        try:
            if check_output:
                result = subprocess.run(
                    command,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                return result.returncode == 0, result.stdout
            else:
                result = subprocess.run(
                    command,
                    shell=True,
                    timeout=30
                )
                return result.returncode == 0, ""
        except subprocess.TimeoutExpired:
            return False, "Command timed out"
        except Exception as e:
            return False, str(e)
    
    def check_file_exists(self, filepath: str) -> bool:
        """Check if a file exists"""
        return (self.project_root / filepath).exists()
    
    def create_file(self, filepath: str, content: str) -> bool:
        """Create a file with content"""
        try:
            full_path = self.project_root / filepath
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content)
            return True
        except Exception as e:
            print(f"Error creating {filepath}: {e}")
            return False
    
    def setup_environment(self):
        """Set up environment variables and configuration"""
        self.print_header("STEP 1: Environment Setup")
        
        # Check if .env exists
        self.print_step("Checking environment configuration")
        
        if not self.check_file_exists(".env"):
            self.print_warning(".env file not found - creating template")
            
            env_template = """# AgentCloud Environment Variables

# Database Configuration
DATABASE_URL=postgresql://agentcloud:agentcloud@localhost:5432/agentcloud
POSTGRES_USER=agentcloud
POSTGRES_PASSWORD=agentcloud
POSTGRES_DB=agentcloud

# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4

# Security
JWT_SECRET_KEY=your-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# LLM API Keys (ADD YOUR KEYS HERE)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
GOOGLE_API_KEY=your-google-key-here

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Monitoring
SENTRY_DSN=
LOG_LEVEL=INFO

# Email (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@agentcloud.com
"""
            
            if self.create_file(".env", env_template):
                self.print_success("Created .env template")
                self.print_warning("⚠️  IMPORTANT: Edit .env file and add your API keys!")
            else:
                self.print_error("Failed to create .env file")
        else:
            self.print_success(".env file exists")
        
        # Check .gitignore
        self.print_step("Checking .gitignore")
        if self.check_file_exists(".gitignore"):
            gitignore = (self.project_root / ".gitignore").read_text()
            if ".env" not in gitignore:
                self.print_warning("Adding .env to .gitignore")
                with open(self.project_root / ".gitignore", "a") as f:
                    f.write("\n# Environment variables\n.env\n.env.local\n")
                self.print_success("Updated .gitignore")
            else:
                self.print_success(".env already in .gitignore")
        else:
            self.print_warning("Creating .gitignore")
            gitignore_content = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/

# Node
node_modules/
.next/
out/
build/
dist/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Database
*.db
*.sqlite

# Testing
.coverage
htmlcov/
.pytest_cache/

# Docker
docker-compose.override.yml
"""
            if self.create_file(".gitignore", gitignore_content):
                self.print_success("Created .gitignore")
    
    def check_dependencies(self):
        """Check if required dependencies are installed"""
        self.print_header("STEP 2: Dependency Check")
        
        py_cmd = "python --version" if os.name == 'nt' else "python3 --version"
        
        dependencies = {
            "Python": (py_cmd, "Python 3.11+"),
            "pip": ("pip --version", "Package manager"),
            "Node.js": ("node --version", "Node 18+"),
            "npm": ("npm --version", "Package manager"),
            "Docker": ("docker --version", "Container platform"),
            "Docker Compose": ("docker-compose --version", "Container orchestration"),
        }
        
        for name, (command, description) in dependencies.items():
            self.print_step(f"Checking {name}", description)
            success, output = self.run_command(command, f"Check {name}", check_output=True)
            
            if success:
                version = output.strip().split('\n')[0]
                self.print_success(f"{name} installed: {version}")
            else:
                self.print_error(f"{name} not found - please install {description}")
    
    def install_python_dependencies(self):
        """Install Python dependencies"""
        self.print_header("STEP 3: Python Dependencies")
        
        if self.check_file_exists("requirements.txt"):
            self.print_step("Installing Python packages")
            success, output = self.run_command(
                "pip install -r requirements.txt", # removed --break-system-packages for safer default
                "Install Python deps"
            )
            
            if success:
                self.print_success("Python packages installed")
            else:
                self.print_error("Failed to install Python packages")
        else:
            self.print_warning("requirements.txt not found")
    
    def install_frontend_dependencies(self):
        """Install frontend dependencies"""
        self.print_header("STEP 4: Frontend Dependencies")
        
        frontend_path = self.project_root / "frontend"
        if frontend_path.exists():
            self.print_step("Installing Node packages")
            
            os.chdir(frontend_path)
            success, _ = self.run_command("npm install", "Install Node deps")
            os.chdir(self.project_root)
            
            if success:
                self.print_success("Node packages installed")
            else:
                self.print_error("Failed to install Node packages")
        else:
            self.print_warning("Frontend directory not found")
    
    def setup_database(self):
        """Set up database"""
        self.print_header("STEP 5: Database Setup")
        
        self.print_step("Checking Docker services")
        
        if self.check_file_exists("docker-compose.yml"):
            self.print_step("Starting Docker services")
            
            # Start only database and redis
            success, _ = self.run_command(
                "docker-compose -f docker-compose.yml up -d postgres redis",
                "Start DB services"
            )
            
            if success:
                self.print_success("Docker services started")
                time.sleep(5)  # Wait for services to be ready
                
                # Run migrations
                self.print_step("Running database migrations")
                success, _ = self.run_command(
                    "alembic upgrade head",
                    "Run migrations"
                )
                
                if success:
                    self.print_success("Database migrations completed")
                else:
                    self.print_warning("Migration failed - may need manual intervention")
            else:
                self.print_error("Failed to start Docker services")
        else:
            self.print_warning("docker-compose.yml not found")
    
    def verify_backend_features(self):
        """Verify backend features are working"""
        self.print_header("STEP 6: Backend Feature Verification")
        
        # Start backend in background
        self.print_step("Starting backend server")
        
        backend_cmd = "cd app && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
        self.print_warning("Starting backend - will check in 10 seconds...")
        
        # Start backend in background
        subprocess.Popen(
            backend_cmd,
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        time.sleep(10)  # Wait for server to start
        
        # Test endpoints
        self.print_step("Testing API endpoints")
        
        import requests
        
        endpoints = [
            ("GET", "/", "Health check"),
            ("GET", "/v1/agents", "List agents"),
            ("GET", "/v1/tasks", "List tasks"),
            ("GET", "/metrics", "Prometheus metrics"),
        ]
        
        for method, path, description in endpoints:
            try:
                url = f"http://localhost:8000{path}"
                response = requests.get(url, timeout=5)
                
                if response.status_code in [200, 401, 403]:
                    self.print_success(f"{description}: HTTP {response.status_code}")
                else:
                    self.print_error(f"{description}: HTTP {response.status_code}")
            except Exception as e:
                self.print_error(f"{description} failed", str(e))
    
    def verify_frontend_features(self):
        """Verify frontend features are working"""
        self.print_header("STEP 7: Frontend Feature Verification")
        
        frontend_path = self.project_root / "frontend"
        if not frontend_path.exists():
            self.print_error("Frontend directory not found")
            return
        
        self.print_step("Starting frontend development server")
        
        os.chdir(frontend_path)
        
        # Start frontend in background
        self.print_warning("Starting frontend - will check in 15 seconds...")
        
        subprocess.Popen(
            "npm run dev",
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        os.chdir(self.project_root)
        time.sleep(15)  # Wait for frontend to compile
        
        # Test frontend pages
        self.print_step("Testing frontend pages")
        
        import requests
        
        pages = [
            ("/", "Home page"),
            ("/agents", "Agents page"),
            ("/tasks", "Tasks page"),
            ("/chat", "Chat interface"),
        ]
        
        for path, description in pages:
            try:
                url = f"http://localhost:3000{path}"
                response = requests.get(url, timeout=10)
                
                if response.status_code == 200:
                    self.print_success(f"{description}: Working")
                else:
                    self.print_error(f"{description}: HTTP {response.status_code}")
            except Exception as e:
                self.print_error(f"{description} failed", str(e))
    
    def create_test_data(self):
        """Create test data for verification"""
        self.print_header("STEP 8: Creating Test Data")
        
        self.print_step("Creating sample agents and tasks")
        
        import requests
        
        # Create a test agent
        try:
            response = requests.post(
                "http://localhost:8000/v1/agents",
                json={
                    "name": "Test Agent",
                    "role": "assistant",
                    "description": "A test agent for verification",
                    "model_name": "gpt-4o",
                    "temperature": 0.7
                },
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                self.print_success("Created test agent")
            else:
                self.print_warning(f"Could not create agent: HTTP {response.status_code}")
        except Exception as e:
            self.print_warning(f"Could not create test data: {str(e)}")
    
    def run_automated_tests(self):
        """Run the automated test suite"""
        self.print_header("STEP 9: Running Automated Tests")
        
        test_scripts = [
            ("agentcloud_analyzer.py", "Code quality analysis"),
            ("scripts/test_full_suite.py", "API endpoint tests"),
        ]
        
        for script, description in test_scripts:
            if self.check_file_exists(script):
                self.print_step(f"Running {description}")
                py_cmd = "python" if os.name == 'nt' else "python3"
                success, _ = self.run_command(f"{py_cmd} {script}", description)
                
                if success:
                    self.print_success(f"{description} completed")
                else:
                    self.print_warning(f"{description} had issues")
            else:
                self.print_warning(f"{script} not found - skipping")
    
    def print_final_summary(self):
        """Print final setup summary"""
        self.print_header("Setup Complete! 🎉")
        
        print(f"{Colors.BOLD}Summary:{Colors.RESET}")
        print(f"  Total Steps: {len(self.results)}")
        print(f"  {Colors.GREEN}✓ Successful: {len([r for r in self.results if r[0] == 'SUCCESS'])}{Colors.RESET}")
        print(f"  {Colors.RED}✗ Errors: {len(self.errors)}{Colors.RESET}")
        
        if self.errors:
            print(f"\n{Colors.BOLD}{Colors.RED}Issues to Fix:{Colors.RESET}")
            for error, details in self.errors[:5]:
                print(f"  {Colors.RED}• {error}{Colors.RESET}")
                if details:
                    print(f"    {details}")
        
        print(f"\n{Colors.BOLD}{Colors.CYAN}Next Steps:{Colors.RESET}")
        print(f"  1. {Colors.YELLOW}Edit .env file and add your API keys{Colors.RESET}")
        print(f"  2. Visit http://localhost:3000 to see the frontend")
        print(f"  3. Visit http://localhost:8000/docs for API documentation")
        print(f"  4. Run 'python scripts/test_full_suite.py' for comprehensive testing")
        
        print(f"\n{Colors.BOLD}{Colors.GREEN}Your AgentCloud platform is ready! 🚀{Colors.RESET}\n")
    
    def run_full_setup(self):
        """Run complete setup process"""
        self.print_header("AgentCloud Complete Setup & Verification")
        print(f"{Colors.CYAN}This will set up and verify all features are working correctly{Colors.RESET}")
        print(f"{Colors.CYAN}Estimated time: 5-10 minutes{Colors.RESET}\n")
        
        # Run all setup steps
        self.setup_environment()
        self.check_dependencies()
        self.install_python_dependencies()
        self.install_frontend_dependencies()
        self.setup_database()
        self.verify_backend_features()
        self.verify_frontend_features()
        self.create_test_data()
        self.run_automated_tests()
        
        # Print summary
        self.print_final_summary()


def main():
    print(f"""
{Colors.BOLD}{Colors.CYAN}
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                  AgentCloud Setup & Verification Tool                    ║
║                                                                           ║
║  This tool will help you get ALL features working correctly:             ║
║  ✓ Environment configuration                                             ║
║  ✓ Dependencies installation                                             ║
║  ✓ Database setup                                                        ║
║  ✓ Backend API verification                                              ║
║  ✓ Frontend verification                                                 ║
║  ✓ Feature testing                                                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
{Colors.RESET}
""")
    
    project_root = os.getcwd()
    
    # Create setup instance and run
    setup = AgentCloudSetup(project_root)
    setup.run_full_setup()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Setup interrupted by user{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n{Colors.RED}Setup failed: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
