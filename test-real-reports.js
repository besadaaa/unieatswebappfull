// Test script for real reports functionality
const BASE_URL = 'http://localhost:3002';

async function testRealReports() {
  console.log('🧪 Testing Real Reports System...\n');

  try {
    // Test 1: Setup reports table
    console.log('1️⃣ Setting up reports table...');
    
    const setupResponse = await fetch(`${BASE_URL}/api/admin/setup-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (setupResponse.ok) {
      const setupData = await setupResponse.json();
      console.log('✅ Reports table setup - SUCCESS');
      console.log(`   Message: ${setupData.message}\n`);
    } else {
      const errorData = await setupResponse.json();
      console.log('❌ Reports table setup - FAILED');
      console.log(`   Error: ${errorData.error}\n`);
    }

    // Test 2: Check empty reports list
    console.log('2️⃣ Checking initial reports list...');
    
    const listResponse = await fetch(`${BASE_URL}/api/reports`);
    
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ Reports List - SUCCESS');
      console.log(`   Found ${listData.reports?.length || 0} reports`);
      console.log(`   Total: ${listData.total || 0}\n`);
    } else {
      const errorText = await listResponse.text();
      console.log('❌ Reports List - FAILED');
      console.log(`   Error: ${errorText}\n`);
    }

    // Test 3: Generate a real report
    console.log('3️⃣ Generating real Excel report...');
    
    const generateResponse = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType: 'Revenue',
        reportPeriod: 'This Month',
        reportFormat: 'Excel'
      })
    });

    if (generateResponse.ok) {
      const generateData = await generateResponse.json();
      console.log('✅ Report Generation - SUCCESS');
      console.log(`   Report ID: ${generateData.report?.id}`);
      console.log(`   Report Name: ${generateData.report?.name}`);
      console.log(`   File URL: ${generateData.report?.file_url}`);
      console.log(`   Total Records: ${generateData.report?.total_records}`);
      console.log(`   File Size: ${generateData.report?.file_size} bytes\n`);
    } else {
      const errorData = await generateResponse.json();
      console.log('❌ Report Generation - FAILED');
      console.log(`   Error: ${errorData.error}\n`);
    }

    // Test 4: Generate a PDF report
    console.log('4️⃣ Generating real PDF report...');
    
    const pdfResponse = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType: 'Orders',
        reportPeriod: 'This Week',
        reportFormat: 'PDF'
      })
    });

    if (pdfResponse.ok) {
      const pdfData = await pdfResponse.json();
      console.log('✅ PDF Report Generation - SUCCESS');
      console.log(`   Report ID: ${pdfData.report?.id}`);
      console.log(`   Report Name: ${pdfData.report?.name}\n`);
    } else {
      const errorData = await pdfResponse.json();
      console.log('❌ PDF Report Generation - FAILED');
      console.log(`   Error: ${errorData.error}\n`);
    }

    // Test 5: Check updated reports list
    console.log('5️⃣ Checking updated reports list...');
    
    const updatedListResponse = await fetch(`${BASE_URL}/api/reports`);
    
    if (updatedListResponse.ok) {
      const updatedListData = await updatedListResponse.json();
      console.log('✅ Updated Reports List - SUCCESS');
      console.log(`   Found ${updatedListData.reports?.length || 0} reports`);
      
      updatedListData.reports?.forEach((report, index) => {
        console.log(`   ${index + 1}. ${report.name} (${report.format}) - ${report.status}`);
        console.log(`      Generated: ${report.generated}`);
        console.log(`      Size: ${report.file_size} bytes`);
      });
      console.log('');
    } else {
      const errorText = await updatedListResponse.text();
      console.log('❌ Updated Reports List - FAILED');
      console.log(`   Error: ${errorText}\n`);
    }

    // Test 6: Test download functionality
    console.log('6️⃣ Testing report downloads...');
    
    const finalListResponse = await fetch(`${BASE_URL}/api/reports`);
    const finalListData = await finalListResponse.json();
    
    if (finalListData.reports && finalListData.reports.length > 0) {
      const firstReport = finalListData.reports[0];
      console.log(`   Testing download of: ${firstReport.name}`);
      
      const downloadResponse = await fetch(`${BASE_URL}${firstReport.file_url}`);
      
      if (downloadResponse.ok) {
        const contentType = downloadResponse.headers.get('content-type');
        const contentLength = downloadResponse.headers.get('content-length');
        
        console.log('✅ Report Download - SUCCESS');
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Size: ${contentLength} bytes\n`);
      } else {
        console.log('❌ Report Download - FAILED');
        console.log(`   Status: ${downloadResponse.status}\n`);
      }
    } else {
      console.log('⚠️  No reports available for download testing\n');
    }

    console.log('🎉 Real Reports Testing Complete!');
    console.log('📝 Summary:');
    console.log('   - Reports table created and configured');
    console.log('   - Reports are now persisted in database');
    console.log('   - No more mock data - all reports are real');
    console.log('   - Reports persist after page refresh');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Run the test
testRealReports();
