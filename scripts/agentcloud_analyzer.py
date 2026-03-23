#!/usr/bin/env python3
"""
AgentCloud Code Analyzer & Improvement Recommendations
Analyzes codebase and provides actionable improvement suggestions
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict, Counter
from dataclasses import dataclass, asdict


@dataclass
class CodeIssue:
    category: str
    severity: str  # "critical", "high", "medium", "low"
    file: str
    line: int
    description: str
    suggestion: str


class AgentCloudAnalyzer:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.issues: List[CodeIssue] = []
        self.metrics = {
            'files': defaultdict(int),
            'lines': defaultdict(int),
        }

    def analyze_python_file(self, filepath: Path) -> List[CodeIssue]:
        issues = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
            self.metrics['files']['python'] += 1
            self.metrics['lines']['python'] += len(lines)
            for i, line in enumerate(lines, 1):
                if re.search(r'(password|secret|key|token)\s*=\s*["\'][^"\']+["\']', line, re.I):
                    # Check for generic keys
                    if not any(k in line for k in ["STREAM_KEY", "DLQ_KEY", "QUEUE_KEY", "REDIS_URL", "DATABASE_URL"]):
                        issues.append(CodeIssue("Security", "critical", str(filepath.relative_to(self.project_root)), i, "Hardcoded credential detected", "Use environment variables"))
                if re.search(r'execute\([^?]*\+\s*', line):
                    issues.append(CodeIssue("Security", "high", str(filepath.relative_to(self.project_root)), i, "Potential SQL injection", "Use parameterized queries"))
                if 'await' in line and 'try' not in content[max(0, content.find(line)-200):content.find(line)]:
                    issues.append(CodeIssue("Error Handling", "medium", str(filepath.relative_to(self.project_root)), i, "Async without try-catch", "Wrap in try-except"))
        except Exception:
            pass
        return issues

    def analyze_typescript_file(self, filepath: Path) -> List[CodeIssue]:
        issues = []
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
            self.metrics['files']['typescript'] += 1
            self.metrics['lines']['typescript'] += len(lines)
            for i, line in enumerate(lines, 1):
                if re.search(r'console\.(log|debug)', line):
                    issues.append(CodeIssue("Best Practices", "low", str(filepath.relative_to(self.project_root)), i, "Console log in code", "Remove for production"))
        except Exception:
            pass
        return issues

    def analyze_project(self):
        for filepath in self.project_root.rglob("*.py"):
            if any(x in str(filepath) for x in ['__pycache__', 'venv', '.git']): continue
            self.issues.extend(self.analyze_python_file(filepath))
        for filepath in self.project_root.rglob("*.ts*"):
            if any(x in str(filepath) for x in ['node_modules', '.next', '.git']): continue
            self.issues.extend(self.analyze_typescript_file(filepath))

    def save_report(self, filename: str = "code_analysis_report.json"):
        report = {
            "metrics": dict(self.metrics),
            "issues": [asdict(i) for i in self.issues],
            "summary": dict(Counter(i.severity for i in self.issues))
        }
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)


if __name__ == "__main__":
    analyzer = AgentCloudAnalyzer(".")
    analyzer.analyze_project()
    analyzer.save_report()
