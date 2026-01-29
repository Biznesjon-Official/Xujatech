const fetch = require('node-fetch');

async function testProductsAPI() {
  const baseURL = 'http://localhost:5000/api';
  
  // First, login to get token
  console.log('🔐 Logging in...');
  const loginRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  
  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('❌ Login failed:', loginData);
    return;
  }
  
  const token = loginData.data.accessToken;
  console.log('✅ Logged in, token:', token.substring(0, 20) + '...');
  
  // Test 1: Get all products
  console.log('\n📦 Test 1: Get all products');
  const allRes = await fetch(`${baseURL}/products`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const allData = await allRes.json();
  console.log('Status:', allRes.status);
  console.log('Success:', allData.success);
  console.log('Count:', allData.data?.length || 0);
  if (allData.data?.length > 0) {
    console.log('First product:', {
      id: allData.data[0]._id,
      name: allData.data[0].name,
      barcode: allData.data[0].barcode,
      price: allData.data[0].sellingPrice
    });
  }
  
  // Test 2: Search products
  console.log('\n🔍 Test 2: Search with "a"');
  const searchRes = await fetch(`${baseURL}/products?search=a`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const searchData = await searchRes.json();
  console.log('Status:', searchRes.status);
  console.log('Success:', searchData.success);
  console.log('Count:', searchData.data?.length || 0);
  if (searchData.data?.length > 0) {
    console.log('Results:');
    searchData.data.slice(0, 3).forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.barcode || 'no barcode'})`);
    });
  }
  
  // Test 3: Search with specific term
  console.log('\n🔍 Test 3: Search with "IMMER"');
  const searchRes2 = await fetch(`${baseURL}/products?search=IMMER`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const searchData2 = await searchRes2.json();
  console.log('Status:', searchRes2.status);
  console.log('Success:', searchData2.success);
  console.log('Count:', searchData2.data?.length || 0);
  if (searchData2.data?.length > 0) {
    console.log('Results:');
    searchData2.data.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.barcode || 'no barcode'})`);
    });
  }
}

testProductsAPI().catch(console.error);
