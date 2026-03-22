const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawn } = require("node:child_process");

const BASE_PORT = 4100;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (options.body !== undefined && headers["content-type"] === undefined) {
    headers["content-type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  return {
    status: response.status,
    headers: response.headers,
    json,
  };
}

async function waitForWorkers(basePort, expectedPorts) {
  const healthUrl = `http://127.0.0.1:${basePort}/api/health`;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const seen = new Set();

    try {
      for (let i = 0; i < expectedPorts.length * 2; i += 1) {
        const response = await fetch(healthUrl);
        if (!response.ok) {
          throw new Error("health request failed");
        }

        const workerPort = response.headers.get("x-worker-port");

        if (workerPort) {
          seen.add(workerPort);
        }
      }

      if (expectedPorts.every((port) => seen.has(String(port)))) {
        return;
      }
    } catch {
      // Keep polling until all workers are reachable.
    }

    await delay(250);
  }

  throw new Error("Workers did not become ready in time");
}

test("multi mode keeps product state consistent between workers", async () => {
  const masterPath = path.join(process.cwd(), "dist", "cluster", "master.js");
  const child = spawn(process.execPath, [masterPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(BASE_PORT),
      HOST: "127.0.0.1",
      WORKERS: "3",
    },
    stdio: ["ignore", "ignore", "ignore"],
  });

  try {
    await waitForWorkers(BASE_PORT, [BASE_PORT + 1, BASE_PORT + 2, BASE_PORT + 3]);

    const createRes = await fetchJson(`http://127.0.0.1:${BASE_PORT}/api/products`, {
      method: "POST",
      body: JSON.stringify({
        name: "Cluster book",
        description: "shared state",
        price: 15,
        category: "books",
        inStock: true,
      }),
    });

    assert.equal(createRes.status, 201);
    const id = createRes.json.id;
    assert.ok(id);

    const getRes = await fetchJson(
      `http://127.0.0.1:${BASE_PORT}/api/products/${id}`,
      { method: "GET" },
    );
    assert.equal(getRes.status, 200);

    const deleteRes = await fetchJson(
      `http://127.0.0.1:${BASE_PORT}/api/products/${id}`,
      { method: "DELETE" },
    );
    assert.equal(deleteRes.status, 204);

    const getAfterDelete = await fetchJson(
      `http://127.0.0.1:${BASE_PORT}/api/products/${id}`,
      { method: "GET" },
    );
    assert.equal(getAfterDelete.status, 404);
  } finally {
    child.kill("SIGTERM");
    await delay(500);
  }
});

test("multi mode load balancer rotates workers in round-robin", async () => {
  const masterPath = path.join(process.cwd(), "dist", "cluster", "master.js");
  const child = spawn(process.execPath, [masterPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(BASE_PORT + 10),
      HOST: "127.0.0.1",
      WORKERS: "3",
    },
    stdio: ["ignore", "ignore", "ignore"],
  });

  try {
    await waitForWorkers(BASE_PORT + 10, [
      BASE_PORT + 11,
      BASE_PORT + 12,
      BASE_PORT + 13,
    ]);

    const base = `http://127.0.0.1:${BASE_PORT + 10}/api/health`;
    const ports = [];

    for (let i = 0; i < 6; i += 1) {
      const res = await fetch(base);
      ports.push(res.headers.get("x-worker-port"));
    }

    const unique = new Set(ports);
    assert.equal(unique.size, 3);

    // After every 3 requests, RR cycle must repeat the same worker order.
    assert.equal(ports[0], ports[3]);
    assert.equal(ports[1], ports[4]);
    assert.equal(ports[2], ports[5]);
  } finally {
    child.kill("SIGTERM");
    await delay(500);
  }
});

test("multi mode processes parallel requests on at least two different workers", async () => {
  const basePort = BASE_PORT + 20;
  const masterPath = path.join(process.cwd(), "dist", "cluster", "master.js");
  const child = spawn(process.execPath, [masterPath], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(basePort),
      HOST: "127.0.0.1",
      WORKERS: "3",
    },
    stdio: ["ignore", "ignore", "ignore"],
  });

  try {
    await waitForWorkers(basePort, [basePort + 1, basePort + 2, basePort + 3]);

    // 1) Parallel creates for two different IDs.
    const [createA, createB] = await Promise.all([
      fetchJson(`http://127.0.0.1:${basePort}/api/products`, {
        method: "POST",
        body: JSON.stringify({
          name: "Parallel A",
          description: "A",
          price: 11,
          category: "books",
          inStock: true,
        }),
      }),
      fetchJson(`http://127.0.0.1:${basePort}/api/products`, {
        method: "POST",
        body: JSON.stringify({
          name: "Parallel B",
          description: "B",
          price: 12,
          category: "books",
          inStock: true,
        }),
      }),
    ]);

    assert.equal(createA.status, 201);
    assert.equal(createB.status, 201);

    const idA = createA.json?.id;
    const idB = createB.json?.id;

    assert.ok(idA);
    assert.ok(idB);
    assert.notEqual(idA, idB);

    // 2) Parallel reads to confirm consistency for both IDs.
    const reads = await Promise.all([
      fetchJson(`http://127.0.0.1:${basePort}/api/products/${idA}`, { method: "GET" }),
      fetchJson(`http://127.0.0.1:${basePort}/api/products/${idB}`, { method: "GET" }),
      fetchJson(`http://127.0.0.1:${basePort}/api/products/${idA}`, { method: "GET" }),
      fetchJson(`http://127.0.0.1:${basePort}/api/products/${idB}`, { method: "GET" }),
    ]);

    for (const response of reads) {
      assert.equal(response.status, 200);
      assert.ok(response.json?.id === idA || response.json?.id === idB);
    }

    // 3) Parallel health checks: at least two different worker pids must respond.
    const healthResponses = await Promise.all(
      Array.from({ length: 12 }, () =>
        fetchJson(`http://127.0.0.1:${basePort}/api/health`, { method: "GET" }),
      ),
    );

    const workerPids = new Set(
      healthResponses
        .map((response) => response.json?.pid)
        .filter((pid) => typeof pid === "number"),
    );

    assert.ok(
      workerPids.size >= 2,
      `Expected at least 2 different worker pids, got ${workerPids.size}`,
    );
  } finally {
    child.kill("SIGTERM");
    await delay(500);
  }
});
