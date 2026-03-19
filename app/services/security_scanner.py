import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class SecurityScanner:
    """
    Analyzes tool calls and shell-like payloads for malicious patterns.
    """
    DANGEROUS_PATTERNS = [
        "rm -rf", "chmod 777", "curl | bash", "> /dev/null", 
        "DROP TABLE", "DELETE FROM *", "eval(", "exec("
    ]

    async def scan_tool_call(self, tool_name: str, arguments: str) -> Dict[str, Any]:
        """
        Scans a tool call for high-risk patterns.
        """
        risk_score = 0
        findings = []

        combined = f"{tool_name} {arguments}"
        for pattern in self.DANGEROUS_PATTERNS:
            if pattern in combined:
                risk_score += 50
                findings.append(f"Dangerous pattern detected: {pattern}")

        is_blocked = risk_score >= 50
        return {
            "risk_score": risk_score,
            "is_blocked": is_blocked,
            "findings": findings
        }

security_scanner = SecurityScanner()
