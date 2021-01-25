"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "J1_new",
    salary: 1000,
    equity: 0.1,
    companyHandle: "c1"
  };


  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "J1_new",
        salary: 1000,
        equity: 0.1,
        companyHandle: "c1"
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 1000,
        equity: 0.1
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        companyHandle: "c5",
        title: "J1_new",
        salary: 1000,
        equity: 0.1
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauthorized error if not admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        companyHandle: "c2",
        title: "J1_new1",
        salary: 1000,
        equity: 0.1
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            companyHandle: "c1",
            title: "J1",
            salary: 1000,
            equity: 0.1
          },
          {
            id: expect.any(Number),
            companyHandle: "c2",
            title: "J2",
            salary: 2000,
            equity: 0.2
          },
          {
            id: expect.any(Number),
            companyHandle: "c3",
            title: "J3",
            salary: 3000,
            equity: 0.3
          }
        ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

});

/************************************** GET /companies/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const result = await db.query(
      `SELECT id
         FROM jobs
         WHERE title = 'J1' AND company_handle='c1'`);
    const id = result.rows[0].id;

    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        companyHandle: "c1",
        title: "J1",
        salary: 1000,
        equity: 0.1
      },
    });
  });

  test("not found for incorrect job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:ID */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const result = await db.query(
      `SELECT id
         FROM jobs
         WHERE title = 'J1' AND company_handle='c1'`);
    const id = result.rows[0].id;

    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "J1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        companyHandle: "c1",
        title: "J1-new",
        salary: 1000,
        equity: 0.1,
      },
    });
  });

  test("unauth for anon", async function () {
    const result = await db.query(
      `SELECT id
         FROM jobs
         WHERE title = 'J1' AND company_handle='c1'`);
    const id = result.rows[0].id;

    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "C1-new",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such id", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "new_name",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/c1`)
      .send({
        companyHandle: "c1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/c1`)
      .send({
        equity: "#$@",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauthorized error if not admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 1000000
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for users", async function () {

    const result = await db.query(
      `SELECT id
         FROM jobs
         WHERE title = 'J1' AND company_handle='c1'`);
    const id = result.rows[0].id;
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${id}` });
  });

  test("unauth for anon", async function () {

    const result = await db.query(
      `SELECT id
         FROM jobs
         WHERE title = 'J1' AND company_handle='c1'`);
    const id = result.rows[0].id;
    const resp = await request(app)
      .delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for incorrect id", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("unauthorized for non admin", async function () {
    const result = await db.query(
      `SELECT id
         FROM jobs
         WHERE title = 'J1' AND company_handle='c1'`);
    const id = result.rows[0].id;
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

});
