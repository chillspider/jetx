#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTests() {
  log('🧪 Starting Pi Node Test Suite', 'cyan');
  log('=' * 50, 'cyan');

  const testTypes = [
    {
      name: 'Unit Tests - Services',
      pattern: 'tests/unit/services/**/*.test.js',
      description: 'Testing core services (StreamManager, SnapshotCache, etc.)'
    },
    {
      name: 'Unit Tests - Controllers',
      pattern: 'tests/unit/controllers/**/*.test.js',
      description: 'Testing API controllers'
    },
    {
      name: 'Unit Tests - Middleware',
      pattern: 'tests/unit/middleware/**/*.test.js',
      description: 'Testing middleware components'
    },
    {
      name: 'Unit Tests - Utils',
      pattern: 'tests/unit/utils/**/*.test.js',
      description: 'Testing utility modules'
    },
    {
      name: 'Integration Tests',
      pattern: 'tests/integration/**/*.test.js',
      description: 'Testing component integration'
    }
  ];

  let allTestsPassed = true;
  const results = [];

  for (const testType of testTypes) {
    log(`\n📋 Running: ${testType.name}`, 'blue');
    log(`   ${testType.description}`, 'white');
    
    try {
      const startTime = Date.now();
      
      const output = execSync(
        `npx jest --testPathPattern="${testType.pattern}" --verbose --colors`,
        { 
          encoding: 'utf8',
          cwd: process.cwd()
        }
      );
      
      const duration = Date.now() - startTime;
      
      log(`✅ ${testType.name} passed (${duration}ms)`, 'green');
      results.push({
        name: testType.name,
        status: 'passed',
        duration
      });
      
    } catch (error) {
      log(`❌ ${testType.name} failed`, 'red');
      console.log(error.stdout);
      
      allTestsPassed = false;
      results.push({
        name: testType.name,
        status: 'failed',
        error: error.message
      });
    }
  }

  // Run full test suite with coverage
  log('\n📊 Running full test suite with coverage...', 'magenta');
  
  try {
    execSync('npx jest --coverage --colors', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log('✅ Coverage report generated', 'green');
  } catch (error) {
    log('❌ Coverage generation failed', 'red');
    allTestsPassed = false;
  }

  // Print summary
  log('\n' + '=' * 50, 'cyan');
  log('📈 Test Results Summary', 'cyan');
  log('=' * 50, 'cyan');

  for (const result of results) {
    const status = result.status === 'passed' ? '✅' : '❌';
    const color = result.status === 'passed' ? 'green' : 'red';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    
    log(`${status} ${result.name}${duration}`, color);
  }

  const passedCount = results.filter(r => r.status === 'passed').length;
  const totalCount = results.length;
  
  log(`\n📊 Overall: ${passedCount}/${totalCount} test suites passed`, 
      allTestsPassed ? 'green' : 'red');

  if (allTestsPassed) {
    log('🎉 All tests passed! Ready for production.', 'green');
    process.exit(0);
  } else {
    log('🚨 Some tests failed. Please fix before deploying.', 'red');
    process.exit(1);
  }
}

// Check if this script is being run directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };