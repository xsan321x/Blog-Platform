/**
 * Comprehensive API test suite
 * Run with: node test.js
 */
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
const results = [];
let passed = 0;
let failed = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

function test(name, condition) {
  if (condition) {
    results.push(`✅ PASS | ${name}`);
    passed++;
  } else {
    results.push(`❌ FAIL | ${name}`);
    failed++;
  }
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

async function runTests() {
  console.log('🧪 Running API tests...\n');

  // ── Health ──────────────────────────────────────────────────────────────────
  const health = await request('GET', '/health');
  test('Health check', health.data.success === true);

  // ── Auth ────────────────────────────────────────────────────────────────────
  const adminLogin = await request('POST', '/auth/login', {
    email: 'admin@system.com',
    password: 'Admin123!',
  });
  test('Admin login', adminLogin.data.data?.user?.role === 'master_admin');
  const adminToken = adminLogin.data.data?.token;

  const email = `e2e_${Date.now()}@test.com`;
  const reg = await request('POST', '/auth/register', {
    name: 'E2E Test User',
    email,
    password: 'Test123!',
  });
  test('Register new user (reader role)', reg.data.data?.user?.role === 'reader');
  const readerToken = reg.data.data?.token;
  const readerId = reg.data.data?.user?._id;

  const me = await request('GET', '/auth/me', null, adminToken);
  test('GET /auth/me', me.data.data?.email === 'admin@system.com');

  const profileUpdate = await request('PUT', '/auth/profile', {
    name: 'Master Admin',
    bio: 'System Master Administrator',
  }, adminToken);
  test('PUT /auth/profile', profileUpdate.data.success === true);

  // ── Posts ───────────────────────────────────────────────────────────────────
  const posts = await request('GET', '/posts');
  test('GET /posts (public)', posts.data.success && posts.data.pagination.total >= 5);

  const postsFiltered = await request('GET', '/posts?sort=popular&limit=3');
  test('GET /posts with sort+limit', postsFiltered.data.data?.length <= 3);

  const slug = posts.data.data?.[0]?.slug;
  const singlePost = await request('GET', `/posts/${slug}`);
  test('GET /posts/:slug (full content)', singlePost.data.data?.content?.length > 0);

  const search = await request('GET', '/posts/search?q=javascript');
  test('GET /posts/search', search.data.success === true);

  const newPost = await request('POST', '/posts', {
    title: `E2E Test Post ${Date.now()}`,
    content: '<h2>Test</h2><p>E2E verification content for testing.</p>',
    status: 'published',
    tags: ['e2e', 'test'],
  }, adminToken);
  test('POST /posts (create)', newPost.status === 201 && newPost.data.data?._id?.length > 0);
  const postId = newPost.data.data?._id;

  const updatedPost = await request('PUT', `/posts/${postId}`, {
    title: 'E2E Updated Post Title',
  }, adminToken);
  test('PUT /posts/:id (update)', updatedPost.data.data?.title === 'E2E Updated Post Title');

  const myPosts = await request('GET', '/posts/my', null, adminToken);
  test('GET /posts/my', myPosts.data.success === true);

  const adminPosts = await request('GET', '/posts/admin/all', null, adminToken);
  test('GET /posts/admin/all', adminPosts.data.success === true);

  const like1 = await request('POST', `/posts/${postId}/like`, null, adminToken);
  test('POST /posts/:id/like (like)', like1.data.data?.liked === true && like1.data.data?.likesCount === 1);

  const like2 = await request('POST', `/posts/${postId}/like`, null, adminToken);
  test('POST /posts/:id/like (unlike toggle)', like2.data.data?.liked === false && like2.data.data?.likesCount === 0);

  // ── Comments ─────────────────────────────────────────────────────────────────
  const comment1 = await request('POST', `/comments/${postId}`, {
    content: 'Top-level comment for E2E testing',
  }, adminToken);
  test('POST /comments (top-level)', comment1.status === 201 && comment1.data.data?._id?.length > 0);
  const commentId = comment1.data.data?._id;

  const reply = await request('POST', `/comments/${postId}`, {
    content: 'Nested reply for E2E testing',
    parentComment: commentId,
  }, adminToken);
  test('POST /comments (nested reply)', reply.data.data?.parentComment === commentId);

  const getComments = await request('GET', `/comments/${postId}`);
  test('GET /comments/:postId', getComments.data.pagination?.total >= 1);

  const getReplies = await request('GET', `/comments/${postId}/replies/${commentId}`);
  test('GET /comments/replies/:commentId', getReplies.data.data?.length >= 1);

  const updateComment = await request('PUT', `/comments/${commentId}`, {
    content: 'Updated comment content',
  }, adminToken);
  test('PUT /comments/:id (update)', updateComment.data.data?.content === 'Updated comment content');

  const deleteComment = await request('DELETE', `/comments/${commentId}`, null, adminToken);
  test('DELETE /comments/:id', deleteComment.data.success === true);

  // ── Users ────────────────────────────────────────────────────────────────────
  const users = await request('GET', '/users', null, adminToken);
  test('GET /users (admin)', users.data.pagination?.total >= 2);

  const userProfile = await request('GET', `/users/${readerId}`);
  test('GET /users/:id (public profile)', userProfile.data.data?.name === 'E2E Test User');

  const userPosts = await request('GET', `/users/${readerId}/posts`);
  test('GET /users/:id/posts', userPosts.data.success === true);

  const assignRole = await request('PUT', `/users/${readerId}/role`, { role: 'author' }, adminToken);
  test('PUT /users/:id/role (-> author)', assignRole.data.data?.role === 'author');

  const toggleStatus = await request('PUT', `/users/${readerId}/status`, null, adminToken);
  test('PUT /users/:id/status (deactivate)', toggleStatus.data.data?.isActive === false);
  await request('PUT', `/users/${readerId}/status`, null, adminToken); // reactivate

  // ── External Services ─────────────────────────────────────────────────────────
  const unsplash = await request('GET', '/unsplash/search?query=mountains', null, adminToken);
  test('GET /unsplash/search', unsplash.data.data?.results?.length > 0);

  const aiGen = await request('POST', '/ai/generate', {
    topic: 'Clean code principles',
    tone: 'professional',
  }, adminToken);
  test('POST /ai/generate', aiGen.data.data?.content?.length > 50);

  const aiImprove = await request('POST', '/ai/improve', {
    text: 'This text needs improvement for better readability and flow.',
  }, adminToken);
  test('POST /ai/improve', aiImprove.data.success === true);

  const aiHeadings = await request('POST', '/ai/suggest-headings', {
    topic: 'Docker containers',
    count: 5,
  }, adminToken);
  test('POST /ai/suggest-headings', aiHeadings.data.data?.headings?.length === 5);

  // ── Validation ────────────────────────────────────────────────────────────────
  const val1 = await request('POST', '/posts', { title: 'X' }, adminToken);
  test('Validation 400 (missing content)', val1.status === 400);

  const val2 = await request('POST', '/auth/register', {
    name: 'X',
    email: 'not-an-email',
    password: '123',
  });
  test('Validation 400 (bad email + short password)', val2.status === 400);

  const val3 = await request('POST', '/auth/login', {
    email: 'admin@system.com',
    password: 'WrongPassword!',
  });
  test('Login with wrong password returns 401', val3.status === 401);

  // ── Security / RBAC ───────────────────────────────────────────────────────────
  const noToken = await request('GET', '/users');
  test('Auth guard: no token returns 401', noToken.status === 401);

  // Register a fresh reader (never promoted) for RBAC test
  const readerEmail = `reader_rbac_${Date.now()}@test.com`;
  const freshReader = await request('POST', '/auth/register', {
    name: 'Fresh Reader',
    email: readerEmail,
    password: 'Test123!',
  });
  const freshReaderToken = freshReader.data.data?.token;
  const freshReaderId = freshReader.data.data?.user?._id;

  const rbac1 = await request('POST', '/posts', {
    title: 'Unauthorized post',
    content: '<p>Should be blocked by RBAC</p>',
    status: 'draft',
  }, freshReaderToken);
  test('RBAC: reader blocked from POST /posts (403)', rbac1.status === 403);

  const rbac2 = await request('GET', '/users', null, freshReaderToken);
  test('RBAC: reader blocked from GET /users (403)', rbac2.status === 403);

  const rbac3 = await request('GET', '/posts/admin/all', null, freshReaderToken);
  test('RBAC: reader blocked from admin routes (403)', rbac3.status === 403);

  // Master admin protection
  const masterAdminId = users.data.data?.find(u => u.role === 'master_admin')?._id;
  const maDelete = await request('DELETE', `/users/${masterAdminId}`, null, adminToken);
  test('Master admin: delete blocked (403)', maDelete.status === 403);

  const maRoleChange = await request('PUT', `/users/${masterAdminId}/role`, { role: 'reader' }, adminToken);
  test('Master admin: role change blocked (403)', maRoleChange.status === 403);

  // Duplicate email
  const dupEmail = await request('POST', '/auth/register', {
    name: 'Dup',
    email: 'admin@system.com',
    password: 'Test123!',
  });
  test('Duplicate email returns 409', dupEmail.status === 409);

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  const delPost = await request('DELETE', `/posts/${postId}`, null, adminToken);
  test('DELETE /posts/:id (cleanup)', delPost.data.success === true);

  const delUser = await request('DELETE', `/users/${readerId}`, null, adminToken);
  test('DELETE /users/:id (cleanup)', delUser.data.success === true);

  const delFreshReader = await request('DELETE', `/users/${freshReaderId}`, null, adminToken);
  test('DELETE fresh reader (cleanup)', delFreshReader.data.success === true);

  // ── Results ───────────────────────────────────────────────────────────────────
  console.log(results.join('\n'));
  console.log('\n' + '═'.repeat(50));
  console.log(`✅ PASSED: ${passed}  ❌ FAILED: ${failed}  📊 TOTAL: ${results.length}`);
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED — Zero errors!');
  } else {
    console.log('⚠️  Some tests failed. Check above for details.');
    process.exit(1);
  }
  console.log('═'.repeat(50));
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
