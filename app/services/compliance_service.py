import logging
import re
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class ComplianceService:
    """
    Scans agent inputs and outputs for PII, toxicity, and rule violations.
    """
    PII_PATTERNS = {
        "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        "phone": r"(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{3}[-\.\s]??\d{4})",
        "ssn": r"\d{3}-\d{2}-\d{4}",
        "credit_card": r"\b(?:\d[ -]*?){13,16}\b"
    }

    MALICIOUS_PATTERNS = [
        r"rm\s+-rf\s+/", 
        r"chmod\s+777", 
        r"cat\s+/etc/passwd",
        r"curl\s+.*\|\s*bash",
        r"wget\s+.*-O\s+-"
    ]

    TOXIC_KEYWORDS = [
        "hate", "violence", "threat", "harass", "abuse", "toxic", "poison"
    ]

    async def scan_content(self, content: str) -> Dict[str, Any]:
        """
        Returns a compliance report for the given text.
        """
        violations = []
        found_pii = []

        # 1. PII Check
        for pii_type, pattern in self.PII_PATTERNS.items():
            if re.search(pattern, content):
                found_pii.append(pii_type)
        
        if found_pii:
            violations.append(f"Potential PII detected: {', '.join(found_pii)}")

        # 2. Malicious Command Check
        for pattern in self.MALICIOUS_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                violations.append(f"Malicious command pattern detected: {pattern}")

        # 3. Toxicity Check (Simplified)
        if any(word in content.lower() for word in self.TOXIC_KEYWORDS):
            violations.append("Potentially toxic or unsafe content detected")

        is_safe = len(violations) == 0
        return {
            "is_safe": is_safe,
            "violations": violations
        }

    async def scan_tool_call(self, tool_name: str, arguments: str) -> Dict[str, Any]:
        """
        Specific check for suspicious tool executions.
        """
        findings = []
        
        # Block shell execution if it contains pipes or redirects
        if tool_name == "shell_execute":
            if any(char in arguments for char in ["|", ">", "&", ";"]):
                findings.append("Restricted shell operators detected (|, >, &, ;)")

        # Block unauthorized file access
        sensitive_files = ["/etc/", "/var/log", ".env", "id_rsa"]
        if any(f in arguments for f in sensitive_files):
            findings.append(f"Unauthorized access attempt to sensitive files/paths")

        return {
            "is_blocked": len(findings) > 0,
            "findings": findings
        }

compliance_service = ComplianceService()
