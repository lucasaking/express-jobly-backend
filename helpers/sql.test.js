"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForpartialUpdate", function () {
  test("works", function () {

    let data = {
      name: "c2-NEW",
      numEmployees: 20
    };
    let jsToSQL = {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    };

    const result = sqlForPartialUpdate(data, jsToSQL);

    expect(result).toEqual({
      setCols: '"name"=$1, "num_employees"=$2',
      values: ["c2-NEW", 20]
    });

  });

  test("doesn't work - invalid inputs", function () {

    let data = {
      name: "c2-NEW",
      numEmployees: 20
    };
    let jsToSQL = {
      logoUrl: "logo_url",
    };

    const result = sqlForPartialUpdate(data, jsToSQL);

    expect(result).not.toEqual({
      setCols: '"name"=$1, "num_employees"=$2',
      values: ["c2-NEW", 20]
    });

  });
});
