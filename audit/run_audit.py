"""
FitnessPro Comprehensive Audit Orchestrator
Runs backend and frontend audits, generates reports.
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from datetime import datetime

# Setup paths
audit_dir = Path(__file__).parent
backend_dir = audit_dir.parent / 'backend'
frontend_dir = audit_dir.parent / 'frontend'
reports_dir = audit_dir / 'reports'
reports_dir.mkdir(exist_ok=True)

def run_backend_audit():
    """Run backend audit suite."""
    print("\n" + "="*70)
    print("[ORCHESTRATOR] Running Backend Audit...")
    print("="*70)
    
    try:
        result = subprocess.run(
            [str(backend_dir / 'venv' / 'Scripts' / 'python.exe'), 
             str(audit_dir / 'backend' / 'audit_backend.py')],
            cwd=str(audit_dir),
            capture_output=True,
            text=True,
            timeout=120
        )
        
        output = result.stdout + result.stderr
        print(output)
        return {
            'status': 'PASSED' if result.returncode == 0 else 'FAILED',
            'output': output,
            'returncode': result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            'status': 'TIMEOUT',
            'output': 'Backend audit timed out',
            'returncode': -1
        }
    except Exception as e:
        return {
            'status': 'ERROR',
            'output': f"Error running backend audit: {str(e)}",
            'returncode': -1
        }

def run_frontend_audit():
    """Run frontend audit suite."""
    print("\n" + "="*70)
    print("[ORCHESTRATOR] Running Frontend Audit...")
    print("="*70)
    
    try:
        result = subprocess.run(
            [str(backend_dir / 'venv' / 'Scripts' / 'python.exe'), 
             str(audit_dir / 'frontend' / 'audit_frontend.py')],
            cwd=str(audit_dir),
            capture_output=True,
            text=True,
            timeout=120
        )
        
        output = result.stdout + result.stderr
        print(output)
        return {
            'status': 'PASSED' if result.returncode == 0 else 'FAILED',
            'output': output,
            'returncode': result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            'status': 'TIMEOUT',
            'output': 'Frontend audit timed out',
            'returncode': -1
        }
    except Exception as e:
        return {
            'status': 'ERROR',
            'output': f"Error running frontend audit: {str(e)}",
            'returncode': -1
        }

def generate_json_report(backend_results, frontend_results):
    """Generate JSON report."""
    report = {
        'timestamp': datetime.now().isoformat(),
        'backend': {
            'status': backend_results['status'],
            'returncode': backend_results['returncode'],
            'output': backend_results['output']
        },
        'frontend': {
            'status': frontend_results['status'],
            'returncode': frontend_results['returncode'],
            'output': frontend_results['output']
        },
        'overall_status': 'PASSED' if (
            backend_results['status'] == 'PASSED' and 
            frontend_results['status'] == 'PASSED'
        ) else 'FAILED'
    }
    
    return report

def generate_html_report(backend_results, frontend_results):
    """Generate HTML report."""
    timestamp = datetime.now().isoformat()
    overall_status = 'PASSED' if (
        backend_results['status'] == 'PASSED' and 
        frontend_results['status'] == 'PASSED'
    ) else 'FAILED'
    
    backend_badge = '[PASS]' if backend_results['status'] == 'PASSED' else '[FAIL]'
    frontend_badge = '[PASS]' if frontend_results['status'] == 'PASSED' else '[FAIL]'
    overall_badge = '[PASS]' if overall_status == 'PASSED' else '[FAIL]'
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FitnessPro System Audit Report</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        .timestamp {{
            opacity: 0.9;
            font-size: 0.9em;
        }}
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f9f9f9;
        }}
        .summary-card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-left: 5px solid #667eea;
        }}
        .summary-card h3 {{
            margin-bottom: 10px;
            color: #667eea;
        }}
        .status-badge {{
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9em;
        }}
        .status-passed {{
            background: #d4edda;
            color: #155724;
        }}
        .status-failed {{
            background: #f8d7da;
            color: #721c24;
        }}
        .content {{
            padding: 30px;
        }}
        .audit-section {{
            margin-bottom: 40px;
        }}
        .audit-section h2 {{
            font-size: 1.5em;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }}
        .output-box {{
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }}
        .footer {{
            background: #f9f9f9;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #ddd;
        }}
        .overall-status {{
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            border-radius: 8px;
            background: {'#d4edda' if overall_status == 'PASSED' else '#f8d7da'};
        }}
        .overall-status h2 {{
            font-size: 2em;
            margin-bottom: 10px;
            border: none;
            padding: 0;
            color: {'#155724' if overall_status == 'PASSED' else '#721c24'};
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FitnessPro System Audit Report</h1>
            <div class="timestamp">Generated: {timestamp}</div>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Backend Audit</h3>
                <div class="status-badge status-{'passed' if backend_results['status'] == 'PASSED' else 'failed'}">
                    {backend_badge} {backend_results['status']}
                </div>
            </div>
            <div class="summary-card">
                <h3>Frontend Audit</h3>
                <div class="status-badge status-{'passed' if frontend_results['status'] == 'PASSED' else 'failed'}">
                    {frontend_badge} {frontend_results['status']}
                </div>
            </div>
            <div class="summary-card">
                <h3>Overall Status</h3>
                <div class="status-badge status-{'passed' if overall_status == 'PASSED' else 'failed'}">
                    {overall_badge} {overall_status}
                </div>
            </div>
        </div>
        
        <div class="content">
            <div class="overall-status">
                <h2>{'AUDIT PASSED' if overall_status == 'PASSED' else 'AUDIT FAILED'}</h2>
                <p>All critical systems are {'operational' if overall_status == 'PASSED' else 'experiencing issues'}.</p>
            </div>
            
            <div class="audit-section">
                <h2>Backend Audit Results</h2>
                <div class="output-box">{backend_results['output']}</div>
            </div>
            
            <div class="audit-section">
                <h2>Frontend Audit Results</h2>
                <div class="output-box">{frontend_results['output']}</div>
            </div>
        </div>
        
        <div class="footer">
            <p>FitnessPro Comprehensive Audit System | Version 1.0</p>
            <p>Report generated on {timestamp}</p>
        </div>
    </div>
</body>
</html>
"""
    
    return html

def save_reports(backend_results, frontend_results):
    """Save JSON and HTML reports."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Generate reports
    json_report = generate_json_report(backend_results, frontend_results)
    html_report = generate_html_report(backend_results, frontend_results)
    
    # Save JSON
    json_path = reports_dir / f"audit_report_{timestamp}.json"
    with open(json_path, 'w') as f:
        json.dump(json_report, f, indent=2)
    print(f"\n[REPORT] JSON report saved: {json_path}")
    
    # Save HTML
    html_path = reports_dir / f"audit_report_{timestamp}.html"
    with open(html_path, 'w') as f:
        f.write(html_report)
    print(f"[REPORT] HTML report saved: {html_path}")
    
    return json_path, html_path

def main():
    """Run full audit orchestration."""
    print("\n" + "="*70)
    print("[ORCHESTRATOR] FitnessPro Comprehensive Audit")
    print("="*70)
    print(f"[INFO] Reports will be saved to: {reports_dir}")
    
    # Run audits
    backend_results = run_backend_audit()
    frontend_results = run_frontend_audit()
    
    # Save reports
    json_path, html_path = save_reports(backend_results, frontend_results)
    
    # Final summary
    print("\n" + "="*70)
    print("[ORCHESTRATOR] Audit Complete")
    print("="*70)
    
    overall_status = 'PASSED' if (
        backend_results['status'] == 'PASSED' and 
        frontend_results['status'] == 'PASSED'
    ) else 'FAILED'
    
    print(f"\n[SUMMARY] Backend Status: {backend_results['status']}")
    print(f"[SUMMARY] Frontend Status: {frontend_results['status']}")
    print(f"[SUMMARY] Overall Status: {overall_status}")
    print(f"\n[REPORT] JSON Report: {json_path}")
    print(f"[REPORT] HTML Report: {html_path}")
    print("\n" + "="*70 + "\n")
    
    return 0 if overall_status == 'PASSED' else 1

if __name__ == '__main__':
    sys.exit(main())
