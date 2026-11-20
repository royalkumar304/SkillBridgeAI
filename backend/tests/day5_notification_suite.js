/**
 * Day 5 Notification System Automated Test Suite
 * Covers all required test cases:
 * - TC-N01: Student submits application -> Recruiter receives APPLICATION_RECEIVED notification
 * - TC-N02: Recruiter shortlists student -> Student receives APPLICATION_SHORTLISTED notification
 * - TC-N03: Recruiter rejects student -> Student receives APPLICATION_REJECTED notification
 * - TC-N04: Recruiter selects student -> Student receives APPLICATION_SELECTED notification
 * - TC-N05: Recruiter updates to same status -> No duplicate notification created
 * - TC-N06: Admin verifies company -> Recruiter receives COMPANY_VERIFIED notification
 * - TC-N07: Admin revokes company -> Recruiter receives COMPANY_VERIFICATION_REVOKED notification
 * - TC-N08: User fetches notifications -> Only own notifications are returned
 * - TC-N09: User marks notification as read -> Unread count decreases correctly
 * - TC-N10: User marks all notifications as read -> All become isRead: true
 * - TC-N11: User attempts to mark another user's notification as read -> Denied with HTTP 404
 * - TC-N12: User attempts to delete another user's notification -> Denied with HTTP 404
 * - TC-N13: Unauthenticated request -> HTTP 401
 * - TC-N14: Student cannot access recruiter/admin notification data (recipient isolation)
 * - TC-N15: Empty notification list returns clean response without crashing
 */

const http = require('http');

const API_BASE = 'http://localhost:5001/api/v1';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${API_BASE}${path}`;
    const url = new URL(fullUrl);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    let bodyData = null;
    if (options.body && typeof options.body === 'object') {
      bodyData = JSON.stringify(options.body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('       SKILLBRIDGE AI — NOTIFICATION SYSTEM TEST SUITE          ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message} ${details ? '— ' + details : ''}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const student1Email = `notif.student1.${timestamp}@univ.edu`;
    const student2Email = `notif.student2.${timestamp}@univ.edu`;
    const recruiterEmail = `notif.recruiter.${timestamp}@techcorp.com`;
    const adminEmail = `notif.admin.${timestamp}@univ.edu`;
    const password = 'Password@123';

    // 1. Setup Accounts
    const s1Reg = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Alice Student', email: student1Email, password, role: 'STUDENT' },
    });
    const s1Token = s1Reg.data?.data?.token;

    const s2Reg = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Bob Peer', email: student2Email, password, role: 'STUDENT' },
    });
    const s2Token = s2Reg.data?.data?.token;

    const recReg = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Dan Recruiter', email: recruiterEmail, password, role: 'RECRUITER' },
    });
    const recToken = recReg.data?.data?.token;

    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@univ.edu', password: 'Password@123' },
    });
    const adminToken = adminLogin.data?.data?.token;

    assert(Boolean(s1Token && s2Token && recToken && adminToken), 'Test user accounts registered successfully');

    // -------------------------------------------------------------
    // TC-N13: Unauthenticated request -> HTTP 401
    // -------------------------------------------------------------
    const unauthRes = await request('/notifications');
    assert(unauthRes.status === 401, 'TC-N13: Unauthenticated request returns HTTP 401');

    // -------------------------------------------------------------
    // TC-N15: Empty notification list
    // -------------------------------------------------------------
    const emptyRes = await request('/notifications', {
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    assert(
      emptyRes.status === 200 &&
      emptyRes.data?.data?.total === 0 &&
      Array.isArray(emptyRes.data?.data?.notifications),
      'TC-N15: Empty notification list returns clean response without error'
    );

    // -------------------------------------------------------------
    // TC-N06 & TC-N07: Admin verifies and revokes company -> Recruiter notified
    // -------------------------------------------------------------
    // Recruiter attempts to create job -> provisions company
    await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recToken}` },
      body: {
        title: 'Initial Pending Opening',
        description: 'Testing company creation',
        requiredSkills: [{ name: 'React', weight: 100 }],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    // Find company in admin list
    const compRes = await request('/admin/companies', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const recComp = compRes.data?.data?.companies?.find((c) => c.recruiter?.email === recruiterEmail);
    assert(Boolean(recComp), 'Recruiter company provisioned');

    // Admin verifies company
    await request(`/admin/companies/${recComp.id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: true },
    });

    // Check recruiter notifications for COMPANY_VERIFIED
    const recNotifAfterVerify = await request('/notifications', {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const compVerifiedNotif = recNotifAfterVerify.data?.data?.notifications?.find(
      (n) => n.type === 'COMPANY_VERIFIED'
    );
    assert(Boolean(compVerifiedNotif), 'TC-N06: Recruiter receives COMPANY_VERIFIED notification upon approval');

    // Admin revokes verification
    await request(`/admin/companies/${recComp.id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: false },
    });

    const recNotifAfterRevoke = await request('/notifications', {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const compRevokedNotif = recNotifAfterRevoke.data?.data?.notifications?.find(
      (n) => n.type === 'COMPANY_VERIFICATION_REVOKED'
    );
    assert(
      Boolean(compRevokedNotif),
      'TC-N07: Recruiter receives COMPANY_VERIFICATION_REVOKED notification upon revocation'
    );

    // Re-verify company so recruiter can publish job
    await request(`/admin/companies/${recComp.id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { verified: true },
    });

    // Recruiter publishes job
    const jobRes = await request('/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recToken}` },
      body: {
        title: 'Full Stack Engineer',
        description: 'Design robust microservices',
        jobType: 'full_time',
        location: 'Remote',
        stipend: '90000',
        minCGPA: 7.0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'published',
        requiredSkills: [{ name: 'React', weight: 50 }, { name: 'Node.js', weight: 50 }],
      },
    });
    const jobId = jobRes.data?.data?.job?._id;
    assert(Boolean(jobId), 'Corporate job published by verified recruiter');

    // -------------------------------------------------------------
    // TC-N01: Student submits application -> Recruiter receives APPLICATION_RECEIVED
    // -------------------------------------------------------------
    const applyRes = await request('/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: { jobId },
    });
    const applicationId = applyRes.data?.data?.application?._id;
    assert(Boolean(applicationId), 'Application submitted by Student 1');

    const recNotifsAfterApp = await request('/notifications', {
      headers: { Authorization: `Bearer ${recToken}` },
    });
    const appReceivedNotif = recNotifsAfterApp.data?.data?.notifications?.find(
      (n) => n.type === 'APPLICATION_RECEIVED' && String(n.relatedEntityId) === String(applicationId)
    );
    assert(
      Boolean(appReceivedNotif),
      'TC-N01: Recruiter receives APPLICATION_RECEIVED notification on student application'
    );

    // -------------------------------------------------------------
    // TC-N02: Recruiter shortlists student -> Student receives APPLICATION_SHORTLISTED
    // -------------------------------------------------------------
    await request(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recToken}` },
      body: { status: 'shortlisted', recruiterFeedback: 'Great qualifications' },
    });

    const s1NotifsShortlist = await request('/notifications', {
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    const shortlistNotif = s1NotifsShortlist.data?.data?.notifications?.find(
      (n) => n.type === 'APPLICATION_SHORTLISTED' && String(n.relatedEntityId) === String(applicationId)
    );
    assert(
      Boolean(shortlistNotif),
      'TC-N02: Student receives APPLICATION_SHORTLISTED notification when recruiter shortlists'
    );

    // -------------------------------------------------------------
    // TC-N05: Recruiter updates to same status -> No duplicate notification
    // -------------------------------------------------------------
    const countBeforeDuplicate = s1NotifsShortlist.data?.data?.notifications?.length;
    await request(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recToken}` },
      body: { status: 'shortlisted', recruiterFeedback: 'Duplicate call test' },
    });

    const s1NotifsAfterDup = await request('/notifications', {
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    const countAfterDuplicate = s1NotifsAfterDup.data?.data?.notifications?.length;
    assert(
      countBeforeDuplicate === countAfterDuplicate,
      'TC-N05: No duplicate notification dispatched when updating to identical status'
    );

    // -------------------------------------------------------------
    // TC-N03: Recruiter rejects student -> Student receives APPLICATION_REJECTED
    // -------------------------------------------------------------
    await request(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recToken}` },
      body: { status: 'rejected' },
    });

    const s1NotifsRejected = await request('/notifications', {
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    const rejectedNotif = s1NotifsRejected.data?.data?.notifications?.find(
      (n) => n.type === 'APPLICATION_REJECTED' && String(n.relatedEntityId) === String(applicationId)
    );
    assert(
      Boolean(rejectedNotif),
      'TC-N03: Student receives APPLICATION_REJECTED notification on status rejection'
    );

    // -------------------------------------------------------------
    // TC-N04: Recruiter selects student -> Student receives APPLICATION_SELECTED
    // -------------------------------------------------------------
    await request(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recToken}` },
      body: { status: 'selected' },
    });

    const s1NotifsSelected = await request('/notifications', {
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    const selectedNotif = s1NotifsSelected.data?.data?.notifications?.find(
      (n) => n.type === 'APPLICATION_SELECTED' && String(n.relatedEntityId) === String(applicationId)
    );
    assert(
      Boolean(selectedNotif),
      'TC-N04: Student receives APPLICATION_SELECTED notification on offer selection'
    );

    // -------------------------------------------------------------
    // TC-N08 & TC-N14: Recipient isolation (Student 2 sees 0 of Student 1's notifications)
    // -------------------------------------------------------------
    const s2Notifs = await request('/notifications', {
      headers: { Authorization: `Bearer ${s2Token}` },
    });
    assert(
      s2Notifs.data?.data?.total === 0,
      'TC-N08 & TC-N14: Complete recipient isolation (Student 2 has 0 notifications from peers)'
    );

    // -------------------------------------------------------------
    // TC-N09: Mark single notification as read
    // -------------------------------------------------------------
    const notifToMark = selectedNotif._id;
    const initialUnread = s1NotifsSelected.data?.data?.unreadCount;

    const markRes = await request(`/notifications/${notifToMark}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    assert(
      markRes.status === 200 &&
      markRes.data?.data?.notification?.isRead === true &&
      markRes.data?.data?.unreadCount === initialUnread - 1,
      'TC-N09: Mark single notification as read updates isRead flag and decrements unread count'
    );

    // -------------------------------------------------------------
    // TC-N10: Mark all notifications as read
    // -------------------------------------------------------------
    const markAllRes = await request('/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${s1Token}` },
    });
    assert(
      markAllRes.status === 200 && markAllRes.data?.data?.unreadCount === 0,
      'TC-N10: Mark all notifications as read resets unreadCount to 0'
    );

    // -------------------------------------------------------------
    // TC-N11: Student 2 attempts to mark Student 1's notification as read -> 404
    // -------------------------------------------------------------
    const maliciousMarkRes = await request(`/notifications/${notifToMark}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${s2Token}` },
    });
    assert(
      maliciousMarkRes.status === 404,
      "TC-N11: Cross-user attempt to mark another user's notification as read is denied (HTTP 404)"
    );

    // -------------------------------------------------------------
    // TC-N12: Student 2 attempts to delete Student 1's notification -> 404
    // -------------------------------------------------------------
    const maliciousDeleteRes = await request(`/notifications/${notifToMark}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${s2Token}` },
    });
    assert(
      maliciousDeleteRes.status === 404,
      "TC-N12: Cross-user attempt to delete another user's notification is securely denied (HTTP 404)"
    );

  } catch (err) {
    console.error('Test execution failed with error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`NOTIFICATION SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
