const test = require("node:test");
const assert = require("node:assert/strict");

const { buildApp } = require("../dist/app");
const { registerErrorHandlers } = require("../dist/errors/error-handler");
const { inMemoryStore } = require("../dist/modules/products/in-memory.store");

function createTestApp() {
  const app = buildApp();
  registerErrorHandlers(app);
  return app;
}

test.beforeEach(() => {
  inMemoryStore.clear();
});

test("CRUD happy path: create, read, update, delete", async () => {
  const app = createTestApp();

  try {
    const createRes = await app.inject({
      method: "POST",
      url: "/api/products",
      payload: {
        name: "Book",
        description: "Interesting",
        price: 10,
        category: "books",
        inStock: true,
      },
    });

    assert.equal(createRes.statusCode, 201);
    const created = JSON.parse(createRes.body);
    assert.equal(typeof created.id, "string");
    assert.equal(created.name, "Book");

    const getRes = await app.inject({
      method: "GET",
      url: `/api/products/${created.id}`,
    });

    assert.equal(getRes.statusCode, 200);

    const updateRes = await app.inject({
      method: "PUT",
      url: `/api/products/${created.id}`,
      payload: {
        name: "Book 2",
        description: "Updated",
        price: 20,
        category: "books",
        inStock: false,
      },
    });

    assert.equal(updateRes.statusCode, 200);
    const updated = JSON.parse(updateRes.body);
    assert.equal(updated.name, "Book 2");
    assert.equal(updated.id, created.id);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/products/${created.id}`,
    });

    assert.equal(deleteRes.statusCode, 204);

    const getAfterDeleteRes = await app.inject({
      method: "GET",
      url: `/api/products/${created.id}`,
    });

    assert.equal(getAfterDeleteRes.statusCode, 404);
  } finally {
    await app.close();
  }
});

test("GET /api/products/:id returns 400 for invalid UUID", async () => {
  const app = createTestApp();

  try {
    const response = await app.inject({
      method: "GET",
      url: "/api/products/not-a-uuid",
    });

    assert.equal(response.statusCode, 400);
  } finally {
    await app.close();
  }
});

test("POST /api/products returns 400 for invalid body", async () => {
  const app = createTestApp();

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/products",
      payload: {
        name: "Broken",
        description: "No positive price",
        price: 0,
        category: "books",
        inStock: true,
      },
    });

    assert.equal(response.statusCode, 400);
  } finally {
    await app.close();
  }
});

test("Unknown route returns 404", async () => {
  const app = createTestApp();

  try {
    const response = await app.inject({
      method: "GET",
      url: "/some-non/existing/resource",
    });

    assert.equal(response.statusCode, 404);
  } finally {
    await app.close();
  }
});

