import os
import sys
import asyncio
import httpx
from colorama import Fore, Style, init

init()

async def check_production_health():
    print(f"{Fore.CYAN}--- AGENTCLOUD PRODUCTION READINESS CHECK ---{Style.RESET_ALL}")
    
    errors = 0
    warnings = 0
    
    # 1. Base API Connectivity
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get("http://localhost:8000/")
            if resp.status_code == 200:
                print(f"{Fore.GREEN}✓ [API] Reachable on Port 8000{Style.RESET_ALL}")
                data = resp.json()
                if data.get("infrastructure", {}).get("pgvector") == "available":
                    print(f"{Fore.GREEN}✓ [DB] pgvector Vector Extension Active{Style.RESET_ALL}")
                else:
                    print(f"{Fore.RED}✗ [DB] pgvector Extension MISSING (RAG will fail){Style.RESET_ALL}")
                    errors += 1
            else:
                print(f"{Fore.RED}✗ [API] Running but returned status {resp.status_code}{Style.RESET_ALL}")
                errors += 1
    except Exception as e:
        print(f"{Fore.RED}✗ [API] Connection Failed: {e}{Style.RESET_ALL}")
        errors += 1

    # 2. Environment Variables
    from app.core.env_validator import EnvironmentValidator
    validator = EnvironmentValidator()
    is_valid, v_errors, v_warnings = validator.validate()
    
    for err in v_errors:
        print(f"{Fore.RED}✗ [ENV] {err}{Style.RESET_ALL}")
        errors += 1
    for warn in v_warnings:
        print(f"{Fore.YELLOW}▲ [ENV] {warn}{Style.RESET_ALL}")
        warnings += 1

    # 3. Docker Sync (Simplified check)
    if os.path.exists("docker-compose.yml"):
        print(f"{Fore.GREEN}✓ [FS] Docker configuration present{Style.RESET_ALL}")
    else:
        print(f"{Fore.YELLOW}▲ [FS] docker-compose.yml missing (Manual deploy?){Style.RESET_ALL}")
        warnings += 1

    print("\n" + "="*40)
    if errors == 0:
        print(f"{Fore.GREEN}STATUS: MISSION READY{Style.RESET_ALL}")
        print(f"Warnings: {warnings}")
        sys.exit(0)
    else:
        print(f"{Fore.RED}STATUS: ABORT - MISSION CRITICAL FAILURES DETECTED{Style.RESET_ALL}")
        print(f"Errors: {errors} | Warnings: {warnings}")
        sys.exit(1)

if __name__ == "__main__":
    # Add project root to path so we can import app modules
    sys.path.append(os.getcwd())
    asyncio.run(check_production_health())
