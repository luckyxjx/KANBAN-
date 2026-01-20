# Security Verification Guide

Comprehensive security verification procedures for the multi-tenant Kanban system.

## Table of Contents

1. [JWT Token Security](#jwt-token-security)
2. [Workspace Isolation](#workspace-isolation)
3. [Authentication and Authorization](#authentication-and-authorization)
4. [Real-Time Security](#real-time-security)
5. [Input Validation](#input-validation)
6. [Data Protection](#data-protection)
7. [Compliance Verification](#compliance-verification)

## JWT Token Security

### Verification Checklist

- [ ] **Token Storage**
  - [ ] JWT tokens are stored in httpOnly cookies only
  - [ ] Tokens are never stored in localStorage
  - [ ] Tokens are never stored in sessionStorage
  - [ ] Tokens are never exposed in URLs
  - [ ] Tokens are never logged or exposed in error messages

- [ ] **Token Generation**
  - [ ] JWT_SECRET is strong (32+ characters, random)
  - [ ] JWT_SECRET is never hardcoded
  - [ ] JWT_SECRET is different per environment
  - [ ] Tokens include user ID and workspace IDs
  - [ ] Tokens include expiration time

- [ ] **Token Validation**
  - [ ] Tokens are validated on every protected request
  - [ ] Expired tokens are rejected
  - [ ] Invalid signatures are rejected
  - [ ] Tampered tokens are rejected
  - [ ] Missing tokens are rejected

- [ ] **Token Expiration**
  - [ ] Access tokens expire after 1 hour
  - [ ] Refresh tokens expire after 7 days
  - [ ] Expired tokens trigger re-authentication
  - [ ] Token refresh works correctly
  - [ ] Logout invalidates tokens

### Testing JWT Security

```typescript
// Test: JWT tokens are stored in httpOnly cookies
test('JWT tokens are stored in httpOnly cookies', async () => {
  const response = await request(app.getHttpServer())
    .post('/auth/google/callback')
    .send({ code: 'valid-code' });

  const setCookieHeader = response.headers['set-cookie'];
  expect(setCookieHeader).toBeDefined();
  expect(setCookieHeader[0]).toContain('HttpOnly');
  expect(setCookieHeader[0]).toContain('Secure');
  expect(setCookieHeader[0]).toContain('SameSite=Strict');
});

// Test: JWT tokens are not exposed in response body
test('JWT tokens are not exposed in response body', async () => {
  const response = await request(app.getHttpServer())
    .post('/auth/google/callback')
    .send({ code: 'valid-code' });

  expect(response.body).not.toHaveProperty('token');
  expect(response.body).not.toHaveProperty('accessToken');
  expect(JSON.stringify(response.body)).not.toContain('eyJ');
});

// Test: Expired tokens are rejected
test('Expired tokens are rejected', async () => {
  const expiredToken = jwt.sign(
    { userId: '123', workspaceIds: ['456'] },
    process.env.JWT_SECRET,
    { expiresIn: '-1h' }
  );

  const response = await request(app.getHttpServer())
    .get('/boards')
    .set('Cookie', `jwt=${expiredToken}`);

  expect(response.status).toBe(401);
});

// Test: Tampered tokens are rejected
test('Tampered tokens are rejected', async () => {
  const token = jwt.sign(
    { userId: '123', workspaceIds: ['456'] },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const tamperedToken = token.slice(0, -10) + 'tampered!!';

  const response = await request(app.getHttpServer())
    .get('/boards')
    .set('Cookie', `jwt=${tamperedToken}`);

  expect(response.status).toBe(401);
});
```

## Workspace Isolation

### Verification Checklist

- [ ] **Query Scoping**
  - [ ] All database queries include workspace filtering
  - [ ] Workspace ID is verified from user context
  - [ ] Cross-workspace queries are impossible
  - [ ] Workspace filtering is applied at service layer
  - [ ] Workspace filtering is applied at database layer

- [ ] **Membership Verification**
  - [ ] User workspace membership is verified on every request
  - [ ] Membership verification includes role checking
  - [ ] Unauthorized access returns 403 Forbidden
  - [ ] Unauthorized access is logged
  - [ ] Membership changes are reflected immediately

- [ ] **Data Isolation**
  - [ ] Boards are isolated by workspace
  - [ ] Lists are isolated by workspace
  - [ ] Cards are isolated by workspace
  - [ ] Activities are isolated by workspace
  - [ ] No cross-workspace data leaks

- [ ] **Cross-Tenant Prevention**
  - [ ] User cannot access other tenant's workspaces
  - [ ] User cannot access other tenant's boards
  - [ ] User cannot access other tenant's data
  - [ ] User cannot modify other tenant's data
  - [ ] User cannot delete other tenant's data

### Testing Workspace Isolation

```typescript
// Test: User cannot access other workspace's boards
test('User cannot access other workspace boards', async () => {
  const user1 = await createUser('user1@example.com');
  const user2 = await createUser('user2@example.com');

  const workspace1 = await createWorkspace(user1.id, 'Workspace 1');
  const workspace2 = await createWorkspace(user2.id, 'Workspace 2');

  const board1 = await createBoard(workspace1.id, 'Board 1');
  const board2 = await createBoard(workspace2.id, 'Board 2');

  const token1 = generateToken(user1.id, [workspace1.id]);

  const response = await request(app.getHttpServer())
    .get(`/boards/${board2.id}`)
    .set('Authorization', `Bearer ${token1}`);

  expect(response.status).toBe(403);
});

// Test: User cannot modify other workspace's data
test('User cannot modify other workspace data', async () => {
  const user1 = await createUser('user1@example.com');
  const user2 = await createUser('user2@example.com');

  const workspace1 = await createWorkspace(user1.id, 'Workspace 1');
  const workspace2 = await createWorkspace(user2.id, 'Workspace 2');

  const board2 = await createBoard(workspace2.id, 'Board 2');

  const token1 = generateToken(user1.id, [workspace1.id]);

  const response = await request(app.getHttpServer())
    .put(`/boards/${board2.id}`)
    .set('Authorization', `Bearer ${token1}`)
    .send({ name: 'Hacked Board' });

  expect(response.status).toBe(403);
  
  const board = await getBoard(board2.id);
  expect(board.name).toBe('Board 2');
});

// Test: Workspace isolation with concurrent users
test('Workspace isolation with concurrent users', async () => {
  const user1 = await createUser('user1@example.com');
  const user2 = await createUser('user2@example.com');

  const workspace1 = await createWorkspace(user1.id, 'Workspace 1');
  const workspace2 = await createWorkspace(user2.id, 'Workspace 2');

  const board1 = await createBoard(workspace1.id, 'Board 1');
  const board2 = await createBoard(workspace2.id, 'Board 2');

  const token1 = generateToken(user1.id, [workspace1.id]);
  const token2 = generateToken(user2.id, [workspace2.id]);

  // User 1 should see only their board
  const response1 = await request(app.getHttpServer())
    .get('/boards')
    .set('Authorization', `Bearer ${token1}`);

  expect(response1.body).toHaveLength(1);
  expect(response1.body[0].id).toBe(board1.id);

  // User 2 should see only their board
  const response2 = await request(app.getHttpServer())
    .get('/boards')
    .set('Authorization', `Bearer ${token2}`);

  expect(response2.body).toHaveLength(1);
  expect(response2.body[0].id).toBe(board2.id);
});
```

## Authentication and Authorization

### Verification Checklist

- [ ] **Google OAuth**
  - [ ] OAuth redirect URI matches production URL
  - [ ] OAuth credentials are correct
  - [ ] OAuth callback creates/retrieves user
  - [ ] OAuth callback generates JWT token
  - [ ] OAuth callback stores token in httpOnly cookie

- [ ] **Authentication Flow**
  - [ ] User can login with Google OAuth
  - [ ] User record is created on first login
  - [ ] Existing user is retrieved on subsequent login
  - [ ] JWT token is generated after login
  - [ ] Session persists across page refreshes

- [ ] **Authorization Flow**
  - [ ] Protected routes require authentication
  - [ ] Workspace routes require workspace membership
  - [ ] Board routes require board access
  - [ ] Unauthorized access returns 403 Forbidden
  - [ ] Unauthorized access is logged

- [ ] **Logout**
  - [ ] Logout clears JWT cookie
  - [ ] Logout clears session data
  - [ ] Logout redirects to login page
  - [ ] Logged out user cannot access protected routes
  - [ ] Logged out user cannot access workspace data

### Testing Authentication and Authorization

```typescript
// Test: Complete authentication flow
test('Complete authentication flow', async () => {
  // 1. User visits login page
  const loginResponse = await request(app.getHttpServer())
    .get('/login');
  expect(loginResponse.status).toBe(200);

  // 2. User clicks Google OAuth button
  const oauthResponse = await request(app.getHttpServer())
    .get('/auth/google');
  expect(oauthResponse.status).toBe(302);
  expect(oauthResponse.headers.location).toContain('accounts.google.com');

  // 3. Google redirects to callback
  const callbackResponse = await request(app.getHttpServer())
    .get('/auth/google/callback?code=valid-code');
  expect(callbackResponse.status).toBe(302);
  expect(callbackResponse.headers['set-cookie']).toBeDefined();

  // 4. User is redirected to dashboard
  expect(callbackResponse.headers.location).toContain('/dashboard');

  // 5. User can access protected routes
  const dashboardResponse = await request(app.getHttpServer())
    .get('/dashboard')
    .set('Cookie', callbackResponse.headers['set-cookie']);
  expect(dashboardResponse.status).toBe(200);
});

// Test: Protected routes require authentication
test('Protected routes require authentication', async () => {
  const response = await request(app.getHttpServer())
    .get('/boards');

  expect(response.status).toBe(401);
});

// Test: Workspace routes require membership
test('Workspace routes require membership', async () => {
  const user1 = await createUser('user1@example.com');
  const user2 = await createUser('user2@example.com');

  const workspace = await createWorkspace(user1.id, 'Workspace');

  const token2 = generateToken(user2.id, []);

  const response = await request(app.getHttpServer())
    .get(`/workspaces/${workspace.id}`)
    .set('Authorization', `Bearer ${token2}`);

  expect(response.status).toBe(403);
});

// Test: Logout clears session
test('Logout clears session', async () => {
  const user = await createUser('user@example.com');
  const token = generateToken(user.id, []);

  // User can access protected routes
  const beforeLogout = await request(app.getHttpServer())
    .get('/boards')
    .set('Authorization', `Bearer ${token}`);
  expect(beforeLogout.status).toBe(200);

  // User logs out
  const logoutResponse = await request(app.getHttpServer())
    .post('/auth/logout')
    .set('Authorization', `Bearer ${token}`);
  expect(logoutResponse.status).toBe(200);

  // User cannot access protected routes
  const afterLogout = await request(app.getHttpServer())
    .get('/boards')
    .set('Authorization', `Bearer ${token}`);
  expect(afterLogout.status).toBe(401);
});
```

## Real-Time Security

### Verification Checklist

- [ ] **WebSocket Authentication**
  - [ ] WebSocket connections require JWT authentication
  - [ ] Invalid tokens are rejected
  - [ ] Expired tokens are rejected
  - [ ] Unauthenticated connections are rejected

- [ ] **Room Membership**
  - [ ] Users can only join rooms for their workspaces
  - [ ] Users cannot join other workspace rooms
  - [ ] Room membership is verified on connection
  - [ ] Room membership is verified on event broadcast

- [ ] **Event Broadcasting**
  - [ ] Events are only broadcast to workspace members
  - [ ] Events are not broadcast to unauthorized users
  - [ ] Events include workspace context
  - [ ] Events are not broadcast to other workspaces

- [ ] **Connection Cleanup**
  - [ ] Connections are cleaned up on disconnect
  - [ ] Subscriptions are cleaned up on disconnect
  - [ ] Room memberships are cleaned up on disconnect
  - [ ] Resources are freed on disconnect

### Testing Real-Time Security

```typescript
// Test: WebSocket requires authentication
test('WebSocket requires authentication', async () => {
  const socket = io('http://localhost:3000', {
    auth: { token: 'invalid-token' },
  });

  socket.on('connect_error', (error) => {
    expect(error.message).toContain('Unauthorized');
  });

  socket.on('connect', () => {
    throw new Error('Should not connect with invalid token');
  });
});

// Test: User can only join their workspace rooms
test('User can only join their workspace rooms', async () => {
  const user1 = await createUser('user1@example.com');
  const user2 = await createUser('user2@example.com');

  const workspace1 = await createWorkspace(user1.id, 'Workspace 1');
  const workspace2 = await createWorkspace(user2.id, 'Workspace 2');

  const token1 = generateToken(user1.id, [workspace1.id]);

  const socket = io('http://localhost:3000', {
    auth: { token: token1 },
  });

  socket.on('connect', () => {
    // Try to join workspace 2 room
    socket.emit('join-workspace', { workspaceId: workspace2.id });

    socket.on('error', (error) => {
      expect(error).toContain('Unauthorized');
    });
  });
});

// Test: Events are only broadcast to workspace members
test('Events are only broadcast to workspace members', async () => {
  const user1 = await createUser('user1@example.com');
  const user2 = await createUser('user2@example.com');

  const workspace1 = await createWorkspace(user1.id, 'Workspace 1');
  const workspace2 = await createWorkspace(user2.id, 'Workspace 2');

  const board1 = await createBoard(workspace1.id, 'Board 1');

  const token1 = generateToken(user1.id, [workspace1.id]);
  const token2 = generateToken(user2.id, [workspace2.id]);

  const socket1 = io('http://localhost:3000', {
    auth: { token: token1 },
  });

  const socket2 = io('http://localhost:3000', {
    auth: { token: token2 },
  });

  socket1.on('connect', () => {
    socket1.emit('join-workspace', { workspaceId: workspace1.id });
  });

  socket2.on('connect', () => {
    socket2.emit('join-workspace', { workspaceId: workspace2.id });
  });

  // User 1 creates a card
  const card = await createCard(board1.id, 'Test Card');

  // User 2 should not receive the event
  socket2.on('card-created', () => {
    throw new Error('User 2 should not receive event from workspace 1');
  });

  // User 1 should receive the event
  socket1.on('card-created', (data) => {
    expect(data.cardId).toBe(card.id);
  });
});
```

## Input Validation

### Verification Checklist

- [ ] **DTO Validation**
  - [ ] All DTOs have validation rules
  - [ ] Required fields are validated
  - [ ] Field types are validated
  - [ ] Field lengths are validated
  - [ ] Invalid input returns 400 Bad Request

- [ ] **XSS Prevention**
  - [ ] User input is sanitized
  - [ ] HTML tags are escaped
  - [ ] JavaScript is not executed
  - [ ] Malicious scripts are blocked
  - [ ] Content is safely rendered

- [ ] **SQL Injection Prevention**
  - [ ] Parameterized queries are used
  - [ ] User input is not concatenated into queries
  - [ ] Prisma ORM prevents SQL injection
  - [ ] Database constraints are enforced

- [ ] **Rate Limiting**
  - [ ] Rate limiting is enforced per user
  - [ ] Rate limiting is enforced per endpoint
  - [ ] Rate limit violations return 429 Too Many Requests
  - [ ] Rate limit headers are returned
  - [ ] Rate limit violations are logged

### Testing Input Validation

```typescript
// Test: XSS prevention
test('XSS prevention', async () => {
  const user = await createUser('user@example.com');
  const workspace = await createWorkspace(user.id, 'Workspace');
  const board = await createBoard(workspace.id, 'Board');

  const token = generateToken(user.id, [workspace.id]);

  const response = await request(app.getHttpServer())
    .post(`/boards/${board.id}/cards`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: '<script>alert("XSS")</script>',
      description: '<img src=x onerror="alert(\'XSS\')">',
    });

  expect(response.status).toBe(201);

  const card = response.body;
  expect(card.title).not.toContain('<script>');
  expect(card.description).not.toContain('onerror');
});

// Test: Rate limiting
test('Rate limiting', async () => {
  const user = await createUser('user@example.com');
  const token = generateToken(user.id, []);

  // Make 101 requests (limit is 100 per minute)
  for (let i = 0; i < 101; i++) {
    const response = await request(app.getHttpServer())
      .get('/boards')
      .set('Authorization', `Bearer ${token}`);

    if (i < 100) {
      expect(response.status).toBe(200);
    } else {
      expect(response.status).toBe(429);
    }
  }
});

// Test: Invalid input validation
test('Invalid input validation', async () => {
  const user = await createUser('user@example.com');
  const workspace = await createWorkspace(user.id, 'Workspace');

  const token = generateToken(user.id, [workspace.id]);

  const response = await request(app.getHttpServer())
    .post('/workspaces')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: '', // Empty name
      description: 'x'.repeat(1001), // Too long
    });

  expect(response.status).toBe(400);
  expect(response.body.message).toContain('validation');
});
```

## Data Protection

### Verification Checklist

- [ ] **Encryption in Transit**
  - [ ] HTTPS is enforced
  - [ ] TLS 1.2+ is required
  - [ ] Valid SSL certificates
  - [ ] No mixed content
  - [ ] Secure cookies

- [ ] **Encryption at Rest**
  - [ ] Sensitive data is encrypted
  - [ ] Database encryption is enabled
  - [ ] Backup encryption is enabled
  - [ ] Key management is secure

- [ ] **Data Minimization**
  - [ ] Only necessary data is collected
  - [ ] Sensitive data is not logged
  - [ ] Passwords are not stored
  - [ ] Tokens are not exposed
  - [ ] PII is protected

- [ ] **Data Retention**
  - [ ] Data retention policy is defined
  - [ ] Old data is deleted
  - [ ] Backups are retained appropriately
  - [ ] Audit logs are retained

### Testing Data Protection

```typescript
// Test: HTTPS is enforced
test('HTTPS is enforced', async () => {
  const response = await request(app.getHttpServer())
    .get('/');

  expect(response.headers['strict-transport-security']).toBeDefined();
});

// Test: Sensitive data is not logged
test('Sensitive data is not logged', async () => {
  const user = await createUser('user@example.com');
  const token = generateToken(user.id, []);

  // Make request with token
  await request(app.getHttpServer())
    .get('/boards')
    .set('Authorization', `Bearer ${token}`);

  // Check logs don't contain token
  const logs = readLogs();
  expect(logs).not.toContain(token);
});

// Test: Passwords are not stored
test('Passwords are not stored', async () => {
  const user = await getUser('user@example.com');

  expect(user.password).toBeUndefined();
  expect(user.passwordHash).toBeUndefined();
});
```

## Compliance Verification

### Verification Checklist

- [ ] **GDPR Compliance**
  - [ ] User consent is obtained
  - [ ] Privacy policy is available
  - [ ] Data access is logged
  - [ ] Data deletion is supported
  - [ ] Data export is supported

- [ ] **Security Standards**
  - [ ] OWASP Top 10 vulnerabilities are addressed
  - [ ] CWE vulnerabilities are addressed
  - [ ] Security headers are configured
  - [ ] Security best practices are followed

- [ ] **Audit Trail**
  - [ ] All user actions are logged
  - [ ] All data changes are logged
  - [ ] All access attempts are logged
  - [ ] Logs are tamper-proof
  - [ ] Logs are retained

- [ ] **Incident Response**
  - [ ] Incident response plan is documented
  - [ ] Security team is trained
  - [ ] Incident detection is enabled
  - [ ] Incident response procedures are tested

### Compliance Testing

```typescript
// Test: User data can be exported
test('User data can be exported', async () => {
  const user = await createUser('user@example.com');
  const workspace = await createWorkspace(user.id, 'Workspace');
  const board = await createBoard(workspace.id, 'Board');

  const token = generateToken(user.id, [workspace.id]);

  const response = await request(app.getHttpServer())
    .get('/user/export')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('user');
  expect(response.body).toHaveProperty('workspaces');
  expect(response.body).toHaveProperty('boards');
});

// Test: User data can be deleted
test('User data can be deleted', async () => {
  const user = await createUser('user@example.com');
  const workspace = await createWorkspace(user.id, 'Workspace');

  const token = generateToken(user.id, [workspace.id]);

  const response = await request(app.getHttpServer())
    .delete('/user')
    .set('Authorization', `Bearer ${token}`);

  expect(response.status).toBe(200);

  // User should not exist
  const deletedUser = await getUser(user.email);
  expect(deletedUser).toBeNull();

  // Workspace should be deleted
  const deletedWorkspace = await getWorkspace(workspace.id);
  expect(deletedWorkspace).toBeNull();
});

// Test: All user actions are logged
test('All user actions are logged', async () => {
  const user = await createUser('user@example.com');
  const workspace = await createWorkspace(user.id, 'Workspace');
  const board = await createBoard(workspace.id, 'Board');

  const token = generateToken(user.id, [workspace.id]);

  // Create card
  await request(app.getHttpServer())
    .post(`/boards/${board.id}/cards`)
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Test Card' });

  // Check activity log
  const activities = await getActivities(workspace.id);
  expect(activities).toContainEqual(
    expect.objectContaining({
      userId: user.id,
      action: 'CREATED',
      entityType: 'card',
    })
  );
});
```

## Security Verification Procedures

### Pre-Deployment

1. **Code Review**
   - [ ] Security team reviews all code changes
   - [ ] No hardcoded secrets
   - [ ] No SQL injection vulnerabilities
   - [ ] No XSS vulnerabilities
   - [ ] No authentication bypasses

2. **Dependency Scanning**
   - [ ] All dependencies are up to date
   - [ ] No known vulnerabilities
   - [ ] License compliance is verified
   - [ ] Dependency tree is reviewed

3. **Static Analysis**
   - [ ] ESLint security rules pass
   - [ ] TypeScript strict mode enabled
   - [ ] No console.log of sensitive data
   - [ ] No eval() or similar functions

4. **Dynamic Testing**
   - [ ] All security tests pass
   - [ ] Penetration testing completed
   - [ ] Vulnerability scanning completed
   - [ ] Load testing completed

### Post-Deployment

1. **Monitoring**
   - [ ] Security events are monitored
   - [ ] Alerts are configured
   - [ ] Logs are reviewed daily
   - [ ] Incidents are tracked

2. **Maintenance**
   - [ ] Dependencies are updated
   - [ ] Security patches are applied
   - [ ] Certificates are renewed
   - [ ] Backups are tested

3. **Auditing**
   - [ ] Security audit is scheduled
   - [ ] Compliance audit is scheduled
   - [ ] Penetration testing is scheduled
   - [ ] Code review is scheduled

---

**Last Updated**: 2024-01-20
**Version**: 1.0
**Status**: Ready for Verification
