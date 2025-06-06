// Test all the fixes for Supabase issues
const BASE_URL = 'http://localhost:3002';

async function testAllFixes() {
  console.log('🔧 Testing All Supabase Fixes...\n');

  const results = {
    apiEndpoints: {},
    databaseOperations: {},
    overallStatus: 'unknown'
  };

  try {
    // Test 1: Simple Cafeteria Applications API (should work now)
    console.log('1️⃣ Testing Simple Cafeteria Applications API...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/cafeteria-applications-simple`);
      
      if (response.ok) {
        const data = await response.json();
        results.apiEndpoints.simpleCafeteriaApplications = {
          status: 'working',
          message: `API responding, found ${data.applications?.length || 0} applications`
        };
        console.log('✅ Simple Cafeteria Applications API working');
        console.log(`   Found ${data.applications?.length || 0} applications`);
      } else {
        const errorText = await response.text();
        results.apiEndpoints.simpleCafeteriaApplications = {
          status: 'error',
          message: `HTTP ${response.status}: ${errorText.substring(0, 100)}`
        };
        console.log('❌ Simple Cafeteria Applications API failed');
        console.log(`   Status: ${response.status}`);
      }
    } catch (error) {
      results.apiEndpoints.simpleCafeteriaApplications = {
        status: 'hanging',
        message: error.message
      };
      console.log('❌ Simple Cafeteria Applications API hanging');
    }

    // Test 2: Create a test application
    console.log('\n2️⃣ Testing Application Creation...');
    
    try {
      const testApp = {
        ownerFirstName: 'Test',
        ownerLastName: 'Owner',
        email: `testfix${Date.now()}@example.com`,
        phone: '+1234567890',
        cafeteriaName: `Test Fix Cafeteria ${Date.now()}`,
        cafeteriaLocation: 'Test Location for Fix Verification',
        cafeteriaDescription: 'Test cafeteria created to verify all fixes are working',
        password: 'testpassword123'
      };
      
      const createResponse = await fetch(`${BASE_URL}/api/cafeteria-applications-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testApp)
      });
      
      if (createResponse.ok) {
        const createData = await createResponse.json();
        results.databaseOperations.applicationCreation = {
          status: 'working',
          applicationId: createData.applicationId,
          message: 'Application created successfully'
        };
        console.log('✅ Application creation working');
        console.log(`   Application ID: ${createData.applicationId}`);
        
        // Test 3: Test approval process
        console.log('\n3️⃣ Testing Approval Process...');
        
        try {
          const approvalResponse = await fetch(`${BASE_URL}/api/cafeteria-applications-simple`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              applicationId: createData.applicationId,
              status: 'approved',
              reviewNotes: 'Test approval - all fixes verification'
            })
          });
          
          if (approvalResponse.ok) {
            const approvalData = await approvalResponse.json();
            results.databaseOperations.approvalProcess = {
              status: 'working',
              message: 'Approval process working'
            };
            console.log('✅ Approval process working');
            console.log(`   Message: ${approvalData.message}`);
            
            // Test 4: Test rejection (reconsider)
            console.log('\n4️⃣ Testing Rejection Process...');
            
            const rejectionResponse = await fetch(`${BASE_URL}/api/cafeteria-applications-simple`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                applicationId: createData.applicationId,
                status: 'rejected',
                reviewNotes: 'Test rejection - reconsider functionality'
              })
            });
            
            if (rejectionResponse.ok) {
              const rejectionData = await rejectionResponse.json();
              results.databaseOperations.rejectionProcess = {
                status: 'working',
                message: 'Rejection process working'
              };
              console.log('✅ Rejection process working');
              console.log(`   Message: ${rejectionData.message}`);
            } else {
              const errorData = await rejectionResponse.json();
              results.databaseOperations.rejectionProcess = {
                status: 'error',
                message: errorData.error
              };
              console.log('❌ Rejection process failed');
              console.log(`   Error: ${errorData.error}`);
            }
          } else {
            const errorData = await approvalResponse.json();
            results.databaseOperations.approvalProcess = {
              status: 'error',
              message: errorData.error
            };
            console.log('❌ Approval process failed');
            console.log(`   Error: ${errorData.error}`);
          }
        } catch (error) {
          results.databaseOperations.approvalProcess = {
            status: 'hanging',
            message: error.message
          };
          console.log('❌ Approval process hanging');
        }
        
      } else {
        const errorData = await createResponse.json();
        results.databaseOperations.applicationCreation = {
          status: 'error',
          message: errorData.error
        };
        console.log('❌ Application creation failed');
        console.log(`   Error: ${errorData.error}`);
        
        if (errorData.error && errorData.error.includes('column') && errorData.error.includes('does not exist')) {
          console.log('\n🚨 DATABASE SCHEMA ISSUE DETECTED');
          console.log('   SOLUTION: Run the database-schema-fix.sql file in Supabase SQL Editor');
        }
      }
    } catch (error) {
      results.databaseOperations.applicationCreation = {
        status: 'hanging',
        message: error.message
      };
      console.log('❌ Application creation hanging');
    }

    // Test 5: Test other working endpoints
    console.log('\n5️⃣ Testing Other Working Endpoints...');
    
    try {
      const healthResponse = await fetch(`${BASE_URL}/api/health`);
      if (healthResponse.ok) {
        results.apiEndpoints.health = { status: 'working' };
        console.log('✅ Health endpoint working');
      } else {
        results.apiEndpoints.health = { status: 'error' };
        console.log('❌ Health endpoint failed');
      }
    } catch (error) {
      results.apiEndpoints.health = { status: 'hanging' };
      console.log('❌ Health endpoint hanging');
    }

    // Determine overall status
    const workingCount = Object.values({...results.apiEndpoints, ...results.databaseOperations})
      .filter(result => result.status === 'working').length;
    const totalCount = Object.keys({...results.apiEndpoints, ...results.databaseOperations}).length;
    
    if (workingCount === totalCount) {
      results.overallStatus = 'all_working';
    } else if (workingCount > 0) {
      results.overallStatus = 'partially_working';
    } else {
      results.overallStatus = 'not_working';
    }

    // Final summary
    console.log('\n🎉 All Fixes Test Complete!');
    console.log('\n📋 Summary:');
    console.log(`   Working: ${workingCount}/${totalCount} components`);
    console.log(`   Overall Status: ${results.overallStatus}`);
    
    if (results.overallStatus === 'all_working') {
      console.log('\n🚀 ALL FIXES SUCCESSFUL!');
      console.log('   ✅ API endpoints responding');
      console.log('   ✅ Database operations working');
      console.log('   ✅ Approval system functional');
      console.log('   ✅ Ready for production use');
    } else if (results.overallStatus === 'partially_working') {
      console.log('\n⚠️  PARTIAL SUCCESS - Some issues remain');
      console.log('   🔧 Check database schema if creation fails');
      console.log('   🔧 Verify environment variables');
    } else {
      console.log('\n❌ FIXES NOT WORKING');
      console.log('   🚨 Database schema needs to be fixed first');
      console.log('   🚨 Run database-schema-fix.sql in Supabase');
    }

    return results;

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    results.overallStatus = 'test_failed';
    return results;
  }
}

// Run the comprehensive test
testAllFixes();
