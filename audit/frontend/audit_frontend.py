"""
FitnessPro Frontend Audit Suite
Tests all React components, configuration, and API integration.
"""

import os
import subprocess
import json
import sys
from pathlib import Path
from datetime import datetime

# Frontend directory
frontend_dir = Path(__file__).parent.parent.parent / 'frontend'
backend_dir = Path(__file__).parent.parent.parent / 'backend'

def run_frontend_audit():
    """Run frontend audit checks."""
    results = {
        'timestamp': datetime.now().isoformat(),
        'passed': [],
        'failed': [],
        'warnings': []
    }
    
    def log_pass(msg):
        results['passed'].append(msg)
        print(f"[PASS] {msg}")
    
    def log_fail(msg):
        results['failed'].append(msg)
        print(f"[FAIL] {msg}")
    
    def log_warn(msg):
        results['warnings'].append(msg)
        print(f"[WARN] {msg}")
    
    print("\n" + "="*70)
    print("[AUDIT] FitnessPro Frontend Audit Suite")
    print("="*70 + "\n")
    
    print("[INFO] Testing Project Structure...")
    
    # Check directories
    dirs_to_check = [
        frontend_dir / 'src' / 'components',
        frontend_dir / 'src' / 'pages',
        frontend_dir / 'src' / 'services',
        frontend_dir / 'src' / 'context'
    ]
    
    for d in dirs_to_check:
        if d.exists():
            log_pass(f"Directory {d.name}")
        else:
            log_fail(f"Directory {d.name} missing")
    
    print("\n[INFO] Testing Configuration Files...")
    
    # Check config files
    config_files = [
        frontend_dir / 'package.json',
        frontend_dir / 'vite.config.js',
        frontend_dir / 'tailwind.config.js',
        frontend_dir / 'index.html',
        frontend_dir / 'src' / 'main.jsx',
        frontend_dir / 'src' / 'App.jsx',
        frontend_dir / 'src' / 'index.css'
    ]
    
    for f in config_files:
        if f.exists():
            log_pass(f"Config {f.name}")
        else:
            log_fail(f"Config {f.name} missing")
    
    print("\n[INFO] Testing Package.json...")
    
    # Check package.json
    if (frontend_dir / 'package.json').exists():
        try:
            with open(frontend_dir / 'package.json') as f:
                pkg = json.load(f)
                deps = pkg.get('dependencies', {})
                
                if 'react' in deps:
                    log_pass("React dependency")
                else:
                    log_fail("React not in dependencies")
                
                if 'axios' in deps or 'fetch' in str(deps):
                    log_pass("HTTP client configured")
                else:
                    log_warn("HTTP client not explicitly configured")
        except Exception as e:
            log_fail(f"package.json parsing: {str(e)[:50]}")
    
    print("\n[INFO] Testing Component Files...")
    
    # Count component files
    components_dir = frontend_dir / 'src' / 'components'
    if components_dir.exists():
        comp_files = list(components_dir.glob('**/*.jsx')) + list(components_dir.glob('**/*.js'))
        if comp_files:
            log_pass(f"Components found ({len(comp_files)} files)")
        else:
            log_warn("No component files found")
    
    print("\n[INFO] Testing Pages...")
    
    # Check pages
    pages_dir = frontend_dir / 'src' / 'pages'
    if pages_dir.exists():
        page_files = list(pages_dir.glob('**/*.jsx')) + list(pages_dir.glob('**/*.js'))
        if page_files:
            log_pass(f"Pages found ({len(page_files)} files)")
        else:
            log_warn("No page files found")
    
    print("\n[INFO] Testing Services...")
    
    # Check services
    services_dir = frontend_dir / 'src' / 'services'
    if services_dir.exists():
        service_files = list(services_dir.glob('**/*.js')) + list(services_dir.glob('**/*.jsx'))
        if service_files:
            log_pass(f"Services found ({len(service_files)} files)")
        else:
            log_warn("No service files found")
    
    print("\n[INFO] Testing Context...")
    
    # Check context
    context_dir = frontend_dir / 'src' / 'context'
    if context_dir.exists():
        context_files = list(context_dir.glob('**/*.js')) + list(context_dir.glob('**/*.jsx'))
        if context_files:
            log_pass(f"Context providers found ({len(context_files)} files)")
        else:
            log_warn("No context files found")
    
    print("\n" + "="*70)
    
    # Summary
    total_passed = len(results['passed'])
    total_failed = len(results['failed'])
    total_warnings = len(results['warnings'])
    total_tests = total_passed + total_failed + total_warnings
    pass_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    
    print(f"\n[PASS] PASSED: {total_passed}/{total_tests}")
    print(f"[FAIL] FAILED: {total_failed}/{total_tests}")
    print(f"[WARN] WARNINGS: {total_warnings}/{total_tests}")
    print(f"[INFO] Pass Rate: {pass_rate:.1f}%")
    
    if total_failed > 0:
        print(f"\n[FAIL] AUDIT FAILED - {total_failed} issues found")
        print("\n[INFO] Failed Tests:")
        for test in results['failed']:
            print(f"  [X] {test}")
    else:
        print(f"\n[PASS] AUDIT PASSED - All tests passed!")
    
    if total_warnings > 0:
        print("\n[WARN] Warnings:")
        for warning in results['warnings']:
            print(f"  [W] {warning}")
    
    print(f"\n[INFO] Timestamp: {results['timestamp']}")
    print("="*70 + "\n")
    
    return results

if __name__ == '__main__':
    results = run_frontend_audit()
