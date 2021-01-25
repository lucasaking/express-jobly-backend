"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    companyHandle: "c1",
    title: "J1_new",
    salary: 1000,
    equity: 0.1
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    delete job.id;
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT id, company_handle, title, salary, equity
           FROM jobs
           WHERE title = 'J1_new'`);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        company_handle: "c1",
        title: "J1_new",
        salary: 1000,
        equity: 0.1
      },
    ]);
  });


  test("throws error with bad data", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

  /************************************** get */

  describe("get", function () {
    test("works", async function () {
      const result = await db.query(
        `SELECT id
           FROM jobs
           WHERE title = 'J1' AND company_handle='c1'`);
      let jobId = result.rows[0].id;
      let job = await Job.get(jobId);
      expect(job).toEqual({
        id: jobId,
        companyHandle: "c1",
        title: "J1",
        salary: 1000,
        equity: 0.1,
      });
    });

    test("not found if no such job", async function () {
      try {
        const result = await Job.get(0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });



/************************************** update */

describe("update", function () {
  const updateData = {
    title: 'J1_updated',
    salary: 5000,
    equity: 0.2,
    companyHandle: "c1"
  };

  // Ask about ...
  test("works", async function () {
    const result = await db.query(
      `SELECT id
           FROM jobs
           WHERE title='J1' AND company_handle='c1'`);

    const id = result.rows[0].id;
    let job = await Job.update(id, updateData);
    expect(job).toEqual({
      id: id,
      title: 'J1_updated',
      salary: 5000,
      equity: 0.2,
      companyHandle: "c1"
    });
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "J1",
      salary: null,
      equity: null
    };
    let result = await db.query(
      `SELECT id
           FROM jobs
           WHERE title = 'J1' AND company_handle='c1'`);

    const id = result.rows[0].id;

    let job = await Job.update(id, updateDataSetNulls);
    expect(job).toEqual({
      id: id,
      title: "J1",
      salary: null,
      equity: null,
      companyHandle: "c1"
    });


    result = await db.query(
      `SELECT id, title, salary, equity, company_handle 
           FROM jobs
           WHERE title = 'J1' AND company_handle='c1'`);
    expect(result.rows).toEqual([{
      id: id,
      title: "J1",
      salary: null,
      equity: null,
      company_handle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      const result = await db.query(
        `SELECT id
             FROM jobs
             WHERE title = 'J1' AND company_handle='c1'`);

      const id = result.rows[0].id;
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {

    const result = await db.query(
      `SELECT id
           FROM jobs
           WHERE title='J1' AND company_handle='c1'`);

    const id = result.rows[0].id;
    await Job.remove(id);
    const res = await db.query(
      `SELECT id FROM jobs WHERE id=${id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

});

  /****Filter Test/Find All *****/


  describe("findAll", function () {
    test("works: with filter!", async function () {
      const filterObj = { hasEquity: true, minSalary: 2900 }
      let companies = await Job.findAll(filterObj);
      expect(companies).toEqual([
        {
          id: expect.any(Number),
          title: "J3",
          equity: 0.3,
          salary: 3000,
          companyHandle: "c3",
        },
      ]);
    });

    test("filter throw bad request err if equity exceeds 1!", async function () {
      try {
        const filterObj = { title: "J3", equity: 3, salary: 3000, company_handle: "c3" };
        let jobs = await Job.findAll(filterObj);
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  });