#!/usr/bin/env python3
"""
AgentCloud UI/UX Improvement Analyzer
Analyzes frontend code and provides UI/UX enhancement recommendations
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict


class UIAnalyzer:
    def __init__(self, frontend_path: str):
        self.frontend_path = Path(frontend_path)
        
    def analyze_component(self, filepath: Path) -> List[Dict]:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            issues = []
            if 'button' in content.lower() and 'aria-label' not in content:
                issues.append({"type": "Accessibility", "severity": "high", "issue": "Buttons missing aria-label"})
            if len(re.findall(r'#[0-9a-fA-F]{3,6}', content)) > 3:
                issues.append({"type": "Design System", "severity": "medium", "issue": "Hardcoded colors found"})
            return issues
        except Exception:
            return []

    def analyze_all(self):
        results = []
        for filepath in self.frontend_path.rglob("*.tsx"):
            if any(x in str(filepath) for x in ['node_modules', '.next']): continue
            issues = self.analyze_component(filepath)
            if issues:
                results.append({"file": str(filepath.relative_to(self.frontend_path)), "issues": issues})
        return results

    def save_report(self, filename: str = "ui_analysis_report.json"):
        report = {"results": self.analyze_all()}
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)


if __name__ == "__main__":
    analyzer = UIAnalyzer("./frontend")
    analyzer.save_report()
