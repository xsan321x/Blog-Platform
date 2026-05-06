/**
 * Test new admin reset features and AI fix
 */
require('dotenv').config();

const BASE = 'http://localhost:5000/api';
let passed = 0; let failed = 0;

const p = (label, pass) => {
  if (pass) { console.log('✅ PASS | ' + label); passed++; }
  else { console.log('❌ FAIL | ' + label); failed++; }
};

async function run() {
  // Login as admin
  const al = await fetch(BASE + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@system.com', password: 'Admin123!' })
  });
  const { data: { token: adminToken } } = await al.json();
  const ah = { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' };

  // Register test user
  const email = `reset_${Date.now()}@test.com`;
  const reg = await fetch(BASE + '/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Reset Test User', email, password: 'OldPass123!' })
  });
  const regData = await reg.json();
  const uid = regData.data.user._id;

  // ── Admin reset profile ──────────────────────────────────────────────────────
  const rp = await fetch(BASE + '/users/' + uid + '/reset-profile', {
    method: 'PUT', headers: ah,
    body: JSON.stringify({ name: 'Admin Updated Name', bio: 'Bio set by admin' })
  });
  const rpd = await rp.json();
  p('Admin reset profile (200)', rp.status === 200);
  p('Name updated correctly', rpd.data?.name === 'Admin Updated Name');
  p('Bio updated correctly', rpd.data?.bio === 'Bio set by admin');

  // ── Admin reset password ─────────────────────────────────────────────────────
  const rpass = await fetch(BASE + '/users/' + uid + '/reset-password', {
    method: 'PUT', headers: ah,
    body: JSON.stringify({ newPassword: 'NewPass456!' })
  });
  p('Admin reset password (200)', rpass.status === 200);

  // New password works
  const newLogin = await fetch(BASE + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'NewPass456!' })
  });
  p('User logs in with new password', newLogin.status === 200);

  // Old password rejected
  const oldLogin = await fetch(BASE + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'OldPass123!' })
  });
  p('Old password rejected (401)', oldLogin.status === 401);

  // Short password rejected
  const shortPass = await fetch(BASE + '/users/' + uid + '/reset-password', {
    method: 'PUT', headers: ah,
    body: JSON.stringify({ newPassword: '123' })
  });
  p('Short password rejected (400)', shortPass.status === 400);

  // ── Master admin protection ──────────────────────────────────────────────────
  const usersRes = await fetch(BASE + '/users', { headers: ah });
  const usersData = await usersRes.json();
  const maUser = usersData.data.data.find(u => u.role === 'master_admin');

  const maPassReset = await fetch(BASE + '/users/' + maUser._id + '/reset-password', {
    method: 'PUT', headers: ah,
    body: JSON.stringify({ newPassword: 'Hacked123!' })
  });
  p('Master admin password protected (403)', maPassReset.status === 403);

  const maProfileReset = await fetch(BASE + '/users/' + maUser._id + '/reset-profile', {
    method: 'PUT', headers: ah,
    body: JSON.stringify({ name: 'Hacked' })
  });
  p('Master admin profile protected (403)', maProfileReset.status === 403);

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  await fetch(BASE + '/users/' + uid, { method: 'DELETE', headers: ah });
  p('Cleanup test user', true);

  // ── AI generate with model fallback ─────────────────────────────────────────
  console.log('\nTesting AI (may take up to 15s per model)...');
  const aiStart = Date.now();
  const aiRes = await fetch(BASE + '/ai/generate', {
    method: 'POST', headers: ah,
    body: JSON.stringify({ topic: 'Python programming', tone: 'educational' })
  });
  const aiData = await aiRes.json();
  const aiTime = Date.now() - aiStart;
  p('AI generate returns 200', aiRes.status === 200);
  p('AI has content (>50 chars)', (aiData.data?.content?.length || 0) > 50);
  p('AI source is valid', ['openrouter', 'template'].includes(aiData.data?.source));
  console.log(`  Source: ${aiData.data?.source} | Model: ${aiData.data?.model || 'template'} | Time: ${aiTime}ms | Length: ${aiData.data?.content?.length}`);

  // AI improve
  const aiImprove = await fetch(BASE + '/ai/improve', {
    method: 'POST', headers: ah,
    body: JSON.stringify({ text: 'This is some text that needs improvement for better clarity and flow.' })
  });
  const aiImpData = await aiImprove.json();
  p('AI improve returns 200', aiImprove.status === 200);
  p('AI improve has result', (aiImpData.data?.improved?.length || 0) > 10);

  // AI headings
  const aiHead = await fetch(BASE + '/ai/suggest-headings', {
    method: 'POST', headers: ah,
    body: JSON.stringify({ topic: 'Machine Learning', count: 4 })
  });
  const aiHeadData = await aiHead.json();
  p('AI headings returns 200', aiHead.status === 200);
  p('AI headings has items', (aiHeadData.data?.headings?.length || 0) > 0);
  console.log(`  Headings: ${JSON.stringify(aiHeadData.data?.headings?.slice(0, 2))}`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`✅ PASSED: ${passed}  ❌ FAILED: ${failed}  📊 TOTAL: ${passed + failed}`);
  if (failed === 0) console.log('🎉 ALL NEW FEATURE TESTS PASSED!');
  console.log('═'.repeat(50));
}

run().catch(e => { console.error('Test error:', e.message); process.exit(1); });
