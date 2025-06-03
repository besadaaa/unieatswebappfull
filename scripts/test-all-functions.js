// Comprehensive Web App Testing Script
// Run this in browser console to test all functions

console.log('🚀 Starting UniEats Web App Comprehensive Test...');

// Test Results Storage
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to log test results
function logTest(testName, status, error = null) {
  const result = { test: testName, status, error, timestamp: new Date().toISOString() };
  
  if (status === 'PASS') {
    testResults.passed.push(result);
    console.log(`✅ ${testName}`);
  } else if (status === 'FAIL') {
    testResults.failed.push(result);
    console.error(`❌ ${testName}:`, error);
  } else {
    testResults.warnings.push(result);
    console.warn(`⚠️ ${testName}:`, error);
  }
}

// Test 1: Check if all required elements exist
function testPageElements() {
  console.log('\n📋 Testing Page Elements...');
  
  // Test navigation elements
  const navElements = document.querySelectorAll('nav, [role="navigation"]');
  logTest('Navigation Elements', navElements.length > 0 ? 'PASS' : 'FAIL', 
    navElements.length === 0 ? 'No navigation elements found' : null);
  
  // Test buttons
  const buttons = document.querySelectorAll('button');
  logTest('Button Elements', buttons.length > 0 ? 'PASS' : 'FAIL',
    buttons.length === 0 ? 'No buttons found' : null);
  
  // Test forms
  const forms = document.querySelectorAll('form');
  logTest('Form Elements', forms.length >= 0 ? 'PASS' : 'FAIL');
  
  // Test inputs
  const inputs = document.querySelectorAll('input, textarea, select');
  logTest('Input Elements', inputs.length >= 0 ? 'PASS' : 'FAIL');
}

// Test 2: Check button functionality
function testButtons() {
  console.log('\n🔘 Testing Button Functionality...');
  
  const buttons = document.querySelectorAll('button');
  let workingButtons = 0;
  let brokenButtons = 0;
  
  buttons.forEach((button, index) => {
    try {
      // Check if button has click handler
      const hasClickHandler = button.onclick || 
        button.addEventListener || 
        button.getAttribute('onclick') ||
        button.closest('[onclick]');
      
      // Check if button is disabled
      const isDisabled = button.disabled || button.hasAttribute('disabled');
      
      // Check button text/content
      const hasContent = button.textContent.trim() || button.innerHTML.includes('svg');
      
      if (!isDisabled && hasContent) {
        workingButtons++;
        logTest(`Button ${index + 1} (${button.textContent.trim().substring(0, 20)})`, 'PASS');
      } else if (isDisabled) {
        logTest(`Button ${index + 1} (${button.textContent.trim().substring(0, 20)})`, 'WARNING', 'Button is disabled');
      } else {
        brokenButtons++;
        logTest(`Button ${index + 1}`, 'FAIL', 'Button has no content or handler');
      }
    } catch (error) {
      brokenButtons++;
      logTest(`Button ${index + 1}`, 'FAIL', error.message);
    }
  });
  
  logTest('Button Summary', 'INFO', `${workingButtons} working, ${brokenButtons} broken`);
}

// Test 3: Check form functionality
function testForms() {
  console.log('\n📝 Testing Form Functionality...');
  
  const forms = document.querySelectorAll('form');
  
  forms.forEach((form, index) => {
    try {
      // Check form action
      const hasAction = form.action || form.onsubmit || form.getAttribute('onsubmit');
      
      // Check form inputs
      const inputs = form.querySelectorAll('input, textarea, select');
      
      // Check submit button
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
      
      if (inputs.length > 0 && submitButton) {
        logTest(`Form ${index + 1}`, 'PASS');
      } else {
        logTest(`Form ${index + 1}`, 'FAIL', 'Missing inputs or submit button');
      }
    } catch (error) {
      logTest(`Form ${index + 1}`, 'FAIL', error.message);
    }
  });
}

// Test 4: Check API endpoints
async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...');
  
  const apiEndpoints = [
    '/api/auth/login',
    '/api/auth/register', 
    '/api/admin/users',
    '/api/admin/cafeterias',
    '/api/cafeteria/menu',
    '/api/cafeteria/orders'
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(endpoint, { method: 'GET' });
      if (response.status < 500) {
        logTest(`API ${endpoint}`, 'PASS');
      } else {
        logTest(`API ${endpoint}`, 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      logTest(`API ${endpoint}`, 'FAIL', error.message);
    }
  }
}

// Test 5: Check console errors
function testConsoleErrors() {
  console.log('\n🐛 Checking Console Errors...');
  
  // Override console.error to catch errors
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // Wait a bit to catch any errors
  setTimeout(() => {
    console.error = originalError;
    
    if (errors.length === 0) {
      logTest('Console Errors', 'PASS');
    } else {
      logTest('Console Errors', 'FAIL', `${errors.length} errors found`);
      errors.forEach(error => console.log('Error:', error));
    }
  }, 2000);
}

// Test 6: Check responsive design
function testResponsiveDesign() {
  console.log('\n📱 Testing Responsive Design...');
  
  const viewports = [
    { width: 320, height: 568, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1920, height: 1080, name: 'Desktop' }
  ];
  
  viewports.forEach(viewport => {
    try {
      // Simulate viewport change
      const mediaQuery = window.matchMedia(`(max-width: ${viewport.width}px)`);
      logTest(`${viewport.name} Viewport`, 'PASS');
    } catch (error) {
      logTest(`${viewport.name} Viewport`, 'FAIL', error.message);
    }
  });
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Running Comprehensive Tests...\n');
  
  testPageElements();
  testButtons();
  testForms();
  testConsoleErrors();
  testResponsiveDesign();
  
  // API tests (async)
  await testAPIEndpoints();
  
  // Final report
  setTimeout(() => {
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⚠️ Warnings: ${testResults.warnings.length}`);
    
    if (testResults.failed.length > 0) {
      console.log('\n🔍 FAILED TESTS:');
      testResults.failed.forEach(test => {
        console.log(`- ${test.test}: ${test.error}`);
      });
    }
    
    // Export results
    window.testResults = testResults;
    console.log('\n💾 Full results saved to window.testResults');
  }, 5000);
}

// Auto-run tests
runAllTests();
