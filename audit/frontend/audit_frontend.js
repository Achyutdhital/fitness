#!/usr/bin/env node

/**
 * FitnessPro Frontend Audit Suite
 * Tests React components, pages, API connectivity, and UI features
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_BASE = process.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const FRONTEND_URL = 'http://127.0.0.1:5173';

// Audit results
const auditResults = {
  passed: [],
  failed: [],
  warnings: [],
  timestamp: new Date().toISOString(),
};

function logPass(testName) {
  auditResults.passed.push(testName);
  console.log(`✓ ${testName}`);
}

function logFail(testName, error) {
  auditResults.failed.push({ test: testName, error: String(error) });
  console.log(`✗ ${testName}: ${error}`);
}

function logWarn(testName, message) {
  auditResults.warnings.push({ test: testName, message });
  console.log(`⚠ ${testName}: ${message}`);
}

// ============================================================================
// PROJECT STRUCTURE AUDIT
// ============================================================================

function auditProjectStructure() {
  const requiredDirs = [
    'src/components',
    'src/pages',
    'src/services',
    'src/context',
  ];

  for (const dir of requiredDirs) {
    try {
      if (fs.existsSync(path.join(__dirname, '../../frontend', dir))) {
        logPass(`Project directory: ${dir}`);
      } else {
        logFail(`Project directory: ${dir}`, 'Not found');
      }
    } catch (e) {
      logFail(`Project directory: ${dir}`, e.message);
    }
  }
}

function auditReactComponents() {
  const componentDirs = [
    'src/components',
    'src/pages',
  ];

  for (const dir of componentDirs) {
    try {
      const dirPath = path.join(__dirname, '../../frontend', dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));
        if (files.length > 0) {
          logPass(`React components in ${dir}: ${files.length} files`);
        } else {
          logWarn(`React components in ${dir}`, 'No component files found');
        }
      }
    } catch (e) {
      logFail(`React components in ${dir}`, e.message);
    }
  }
}

function auditServiceLayer() {
  try {
    const servicesPath = path.join(__dirname, '../../frontend/src/services');
    if (fs.existsSync(servicesPath)) {
      const files = fs.readdirSync(servicesPath);
      const apiServices = files.filter(f => f.includes('api') || f.includes('service'));
      if (apiServices.length > 0) {
        logPass(`API services found: ${apiServices.length} files`);
      } else {
        logWarn('API services', 'No service files found');
      }
    }
  } catch (e) {
    logFail('API services', e.message);
  }
}

// ============================================================================
// BACKEND API AUDIT
// ============================================================================

async function auditAPIConnectivity() {
  try {
    const response = await axios.get(`${API_BASE}/api/`);
    if (response.status === 200) {
      logPass('Backend API connectivity');
    } else {
      logFail('Backend API connectivity', `Status: ${response.status}`);
    }
  } catch (error) {
    logFail('Backend API connectivity', error.message);
  }
}

async function auditEndpoints() {
  const endpoints = [
    { name: 'Subscription plans', path: '/api/subscriptions/plans/' },
    { name: 'Workouts', path: '/api/workouts/workouts/' },
    { name: 'Workout categories', path: '/api/workouts/categories/' },
    { name: 'CMS pages', path: '/api/cms/pages/' },
    { name: 'Blog posts', path: '/api/cms/blog-posts/' },
    { name: 'API docs', path: '/api/docs/' },
    { name: 'Admin interface', path: '/admin/' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${API_BASE}${endpoint.path}`, {
        validateStatus: () => true, // Don't throw on any status
      });
      
      if (response.status < 500) {
        logPass(`Endpoint: ${endpoint.name}`);
      } else {
        logFail(`Endpoint: ${endpoint.name}`, `Status: ${response.status}`);
      }
    } catch (error) {
      logFail(`Endpoint: ${endpoint.name}`, error.message);
    }
  }
}

async function auditAuthEndpoints() {
  const endpoints = [
    { name: 'Register', path: '/api/auth/register/', method: 'POST' },
    { name: 'Login', path: '/api/auth/login/', method: 'POST' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${API_BASE}${endpoint.path}`,
        data: {},
        validateStatus: () => true,
      });
      
      if (response.status < 500) {
        logPass(`Auth endpoint: ${endpoint.name}`);
      } else {
        logFail(`Auth endpoint: ${endpoint.name}`, `Status: ${response.status}`);
      }
    } catch (error) {
      logFail(`Auth endpoint: ${endpoint.name}`, error.message);
    }
  }
}

// ============================================================================
// FRONTEND CONFIGURATION AUDIT
// ============================================================================

function auditEnvironmentConfig() {
  try {
    const envPath = path.join(__dirname, '../../frontend/.env');
    const envExamplePath = path.join(__dirname, '../../frontend/.env.example');
    
    if (fs.existsSync(envPath)) {
      logPass('Frontend .env file exists');
    } else if (fs.existsSync(envExamplePath)) {
      logWarn('Frontend environment', '.env not found but .env.example exists');
    } else {
      logFail('Frontend environment', 'No .env or .env.example file');
    }
  } catch (e) {
    logFail('Frontend environment', e.message);
  }
}

function auditViteConfig() {
  try {
    const vitePath = path.join(__dirname, '../../frontend/vite.config.js');
    if (fs.existsSync(vitePath)) {
      logPass('Vite configuration');
    } else {
      logFail('Vite configuration', 'vite.config.js not found');
    }
  } catch (e) {
    logFail('Vite configuration', e.message);
  }
}

function auditTailwindConfig() {
  try {
    const tailwindPath = path.join(__dirname, '../../frontend/tailwind.config.js');
    if (fs.existsSync(tailwindPath)) {
      logPass('Tailwind CSS configuration');
    } else {
      logFail('Tailwind CSS configuration', 'tailwind.config.js not found');
    }
  } catch (e) {
    logFail('Tailwind CSS configuration', e.message);
  }
}

function auditPackageJson() {
  try {
    const pkgPath = path.join(__dirname, '../../frontend/package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    
    const requiredDeps = ['react', 'axios', 'react-router-dom'];
    const missingDeps = requiredDeps.filter(
      dep => !pkg.dependencies[dep] && !pkg.devDependencies[dep]
    );
    
    if (missingDeps.length === 0) {
      logPass('Required npm dependencies');
    } else {
      logFail('Required npm dependencies', `Missing: ${missingDeps.join(', ')}`);
    }
  } catch (e) {
    logFail('Package.json validation', e.message);
  }
}

// ============================================================================
// REACT FEATURES AUDIT
// ============================================================================

function auditContextProviders() {
  try {
    const contextPath = path.join(__dirname, '../../frontend/src/context');
    if (fs.existsSync(contextPath)) {
      const files = fs.readdirSync(contextPath);
      if (files.length > 0) {
        logPass(`React Context providers: ${files.length} files`);
      } else {
        logWarn('React Context', 'No context files found');
      }
    } else {
      logWarn('React Context', 'Context folder not found');
    }
  } catch (e) {
    logFail('React Context', e.message);
  }
}

function auditRutingConfig() {
  try {
    const pagesPath = path.join(__dirname, '../../frontend/src/pages');
    if (fs.existsSync(pagesPath)) {
      const files = fs.readdirSync(pagesPath);
      if (files.length > 2) {
        logPass(`React Router pages: ${files.length} page components`);
      } else {
        logWarn('React Router', 'Few page components found');
      }
    }
  } catch (e) {
    logFail('React Router', e.message);
  }
}

function auditStateManagement() {
  try {
    const appPath = path.join(__dirname, '../../frontend/src/App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    if (appContent.includes('Provider') || appContent.includes('Context')) {
      logPass('State management setup');
    } else {
      logWarn('State management', 'No Context provider found in App.jsx');
    }
  } catch (e) {
    logFail('State management', e.message);
  }
}

// ============================================================================
// STYLING AUDIT
// ============================================================================

function auditStyling() {
  try {
    const cssPath = path.join(__dirname, '../../frontend/src/index.css');
    if (fs.existsSync(cssPath)) {
      logPass('CSS stylesheet present');
    } else {
      logWarn('Styling', 'index.css not found');
    }
  } catch (e) {
    logFail('Styling', e.message);
  }
}

// ============================================================================
// RUN FULL AUDIT
// ============================================================================

async function runFullAudit() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 FitnessPro Frontend Audit Suite');
  console.log('='.repeat(70) + '\n');

  console.log('📁 Auditing Project Structure...');
  auditProjectStructure();
  auditReactComponents();
  auditServiceLayer();

  console.log('\n🔧 Auditing Configuration...');
  auditEnvironmentConfig();
  auditViteConfig();
  auditTailwindConfig();
  auditPackageJson();

  console.log('\n⚛️ Auditing React Features...');
  auditContextProviders();
  auditRutingConfig();
  auditStateManagement();

  console.log('\n🎨 Auditing Styling...');
  auditStyling();

  console.log('\n🔗 Auditing Backend Integration...');
  await auditAPIConnectivity();
  await auditEndpoints();
  await auditAuthEndpoints();

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📋 AUDIT SUMMARY');
  console.log('='.repeat(70));
  console.log(`✓ Passed: ${auditResults.passed.length}`);
  console.log(`✗ Failed: ${auditResults.failed.length}`);
  console.log(`⚠ Warnings: ${auditResults.warnings.length}`);

  if (auditResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    for (const failure of auditResults.failed) {
      console.log(`  - ${failure.test}: ${failure.error}`);
    }
  }

  if (auditResults.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    for (const warning of auditResults.warnings) {
      console.log(`  - ${warning.test}: ${warning.message}`);
    }
  }

  // Overall status
  const total = auditResults.passed.length + auditResults.failed.length;
  const passRate = total > 0 ? (auditResults.passed.length / total * 100) : 0;

  console.log('\n' + '='.repeat(70));
  if (passRate >= 90) {
    console.log(`✅ AUDIT PASSED (${passRate.toFixed(1)}% pass rate)`);
  } else if (passRate >= 70) {
    console.log(`⚠️ AUDIT PARTIAL (${passRate.toFixed(1)}% pass rate)`);
  } else {
    console.log(`❌ AUDIT FAILED (${passRate.toFixed(1)}% pass rate)`);
  }
  console.log('='.repeat(70) + '\n');

  return auditResults;
}

// Run audit
runFullAudit().then(results => {
  process.exit(results.failed.length === 0 ? 0 : 1);
}).catch(error => {
  console.error('Audit error:', error);
  process.exit(1);
});
