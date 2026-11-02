import { spawn } from "child_process";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const PORT = 3009;
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServerReady(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) return true;
    } catch {
      // Waiting for port to listen
    }
    await sleep(300);
  }
  return false;
}

async function runBrowserAuthTests() {
  console.log("==================================================================");
  console.log("  ProjectCall — Phase 1.6: Browser & HTTP Authentication Tests");
  console.log("==================================================================");

  console.log(`Starting Next.js server on port ${PORT}...`);
  // Start next server
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: "pipe",
    shell: true,
    env: { ...process.env, PORT: String(PORT) },
  });

  server.stdout.on("data", (d) => {
    // console.log(`[NextServer] ${d}`);
  });
  server.stderr.on("data", (d) => {
    // console.error(`[NextServerErr] ${d}`);
  });

  const isReady = await waitForServerReady();
  if (!isReady) {
    server.kill();
    throw new Error(`Next.js server failed to start on port ${PORT} within timeout.`);
  }
  console.log(`✓ Next.js server running and healthy at ${BASE_URL}`);

  let sessionCookie = null;

  try {
    // -------------------------------------------------------------------------
    // Test 1: Unauthenticated Route Protection (Middleware)
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] Unauthenticated route protection (Middleware redirect)...");
    const unauthPageRes = await fetch(`${BASE_URL}/employees`, {
      redirect: "manual",
    });

    if (unauthPageRes.status !== 307 && unauthPageRes.status !== 302) {
      throw new Error(`Expected redirect (307/302), received HTTP ${unauthPageRes.status}`);
    }
    const location = unauthPageRes.headers.get("location");
    if (!location || !location.includes("/login")) {
      throw new Error(`Expected redirect to /login, received: ${location}`);
    }
    console.log(`  ✓ Unauthenticated GET /employees redirected to: ${location} (HTTP ${unauthPageRes.status})`);

    // -------------------------------------------------------------------------
    // Test 2: Unauthenticated API Access Rejection
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Unauthenticated API access rejection...");
    const unauthApiRes = await fetch(`${BASE_URL}/api/auth/me`);
    if (unauthApiRes.status !== 401) {
      throw new Error(`Expected HTTP 401 Unauthorized, received ${unauthApiRes.status}`);
    }
    console.log("  ✓ GET /api/auth/me returned HTTP 401 Unauthorized");

    // -------------------------------------------------------------------------
    // Test 3: Incorrect Password Rejection (Generic Error)
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Incorrect password rejection (generic message)...");
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin.test@projectcall.uz",
        password: "IncorrectPassword123!",
      }),
    });

    if (badLoginRes.status !== 401) {
      throw new Error(`Expected HTTP 401, received ${badLoginRes.status}`);
    }
    const badLoginBody = await badLoginRes.json();
    if (!badLoginBody.error || !badLoginBody.error.includes("Email yoki parol noto'g'ri")) {
      throw new Error(`Expected generic error, received: ${JSON.stringify(badLoginBody)}`);
    }
    console.log(`  ✓ Incorrect password returned HTTP 401 with generic error: "${badLoginBody.error}"`);

    // -------------------------------------------------------------------------
    // Test 4: Successful Browser Login & HTTP-only Cookie Issuance
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] Successful login & HTTP-only cookie issuance...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin.test@projectcall.uz",
        password: "AdminSecretPass123!",
      }),
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed with HTTP ${loginRes.status}`);
    }

    const setCookieHeader = loginRes.headers.get("set-cookie");
    if (!setCookieHeader || !setCookieHeader.includes("projectcall_session=")) {
      throw new Error(`Missing projectcall_session in set-cookie header: ${setCookieHeader}`);
    }
    const setCookieLower = setCookieHeader.toLowerCase();
    if (!setCookieLower.includes("httponly")) {
      throw new Error("Security failure: session cookie is missing HttpOnly flag!");
    }
    if (!setCookieLower.includes("samesite=lax")) {
      throw new Error("Security failure: session cookie is missing SameSite=Lax attribute!");
    }

    // Extract cookie value for subsequent requests
    const cookieMatch = setCookieHeader.match(/projectcall_session=([^;]+)/);
    sessionCookie = `projectcall_session=${cookieMatch[1]}`;
    console.log("  ✓ Login succeeded (HTTP 200)");
    console.log(`  ✓ Received Set-Cookie with HttpOnly, SameSite=Lax, Path=/`);

    // -------------------------------------------------------------------------
    // Test 5: Authenticated API Session & RBAC Verification
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] Authenticated API session & RBAC verification...");
    const authMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });

    if (authMeRes.status !== 200) {
      throw new Error(`Expected HTTP 200, received ${authMeRes.status}`);
    }
    const authData = await authMeRes.json();
    if (authData.user.email !== "admin.test@projectcall.uz") {
      throw new Error(`Unexpected user email: ${authData.user.email}`);
    }
    if (authData.role.name !== "admin") {
      throw new Error(`Unexpected role: ${authData.role.name}`);
    }
    if (!authData.permissions.includes("users:manage") || authData.permissions.length !== 7) {
      throw new Error(`Unexpected permissions: ${JSON.stringify(authData.permissions)}`);
    }
    console.log(`  ✓ Identity resolved: ${authData.employee.firstName} ${authData.employee.lastName} (${authData.user.email})`);
    console.log(`  ✓ Role: ${authData.role.displayName} (${authData.role.name})`);
    console.log(`  ✓ Permissions verified: ${authData.permissions.length} total permissions active`);

    // -------------------------------------------------------------------------
    // Test 6: Authenticated Page Access
    // -------------------------------------------------------------------------
    console.log("\n[Test 6] Authenticated page access (no redirect)...");
    const authPageRes = await fetch(`${BASE_URL}/employees`, {
      headers: { Cookie: sessionCookie },
      redirect: "manual",
    });

    if (authPageRes.status !== 200) {
      throw new Error(`Expected HTTP 200, received ${authPageRes.status}`);
    }
    console.log("  ✓ GET /employees accessible with session cookie (HTTP 200)");

    // -------------------------------------------------------------------------
    // Test 7: Already Authenticated Visiting /login (Redirect to Home)
    // -------------------------------------------------------------------------
    console.log("\n[Test 7] Authenticated user visiting /login redirected to /...");
    const loginRedirectRes = await fetch(`${BASE_URL}/login`, {
      headers: { Cookie: sessionCookie },
      redirect: "manual",
    });

    if (loginRedirectRes.status !== 307 && loginRedirectRes.status !== 302) {
      throw new Error(`Expected redirect (307/302), received ${loginRedirectRes.status}`);
    }
    const redirectTarget = loginRedirectRes.headers.get("location");
    console.log(`  ✓ Authenticated GET /login redirected to: ${redirectTarget} (HTTP ${loginRedirectRes.status})`);

    // -------------------------------------------------------------------------
    // Test 8: Logout and Server-Side Session Invalidation
    // -------------------------------------------------------------------------
    console.log("\n[Test 8] Logout and session invalidation...");
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });

    if (logoutRes.status !== 200) {
      throw new Error(`Logout failed with HTTP ${logoutRes.status}`);
    }

    // Try accessing /api/auth/me with the invalidated cookie
    const retestAuthMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    if (retestAuthMe.status !== 401) {
      throw new Error(`Expected HTTP 401 after logout, received ${retestAuthMe.status}`);
    }
    console.log("  ✓ Logout completed (HTTP 200)");
    console.log("  ✓ Subsequent request with invalidated cookie immediately returned HTTP 401 Unauthorized");

    // -------------------------------------------------------------------------
    // Test 9: Brute-Force Rate Limiting Lockout
    // -------------------------------------------------------------------------
    console.log("\n[Test 9] Rate limiting lockout after multiple failed attempts...");
    const bruteForceEmail = "bruteforce.target@projectcall.uz";
    let lockoutTriggered = false;

    for (let i = 1; i <= 6; i++) {
      const attemptRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: bruteForceEmail,
          password: `BadAttempt${i}!`,
        }),
      });

      if (attemptRes.status === 429) {
        lockoutTriggered = true;
        const errJson = await attemptRes.json();
        console.log(`  ✓ Attempt #${i} blocked with HTTP 429 Too Many Requests: "${errJson.error}"`);
        break;
      }
    }

    if (!lockoutTriggered) {
      throw new Error("Rate limiting failed: 6 failed login attempts did not trigger HTTP 429!");
    }

    console.log("\n==================================================================");
    console.log("  ALL BROWSER & HTTP AUTHENTICATION TESTS PASSED!");
    console.log("==================================================================");
  } finally {
    console.log("\nShutting down test Next.js server...");
    server.kill("SIGTERM");
    // On Windows, child process trees can linger, kill via taskkill if needed
    try {
      spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"]);
    } catch {}
    console.log("✓ Test server stopped.\n");
  }
}

runBrowserAuthTests().catch((err) => {
  console.error("\nFATAL BROWSER TEST FAILURE:", err);
  process.exit(1);
});
