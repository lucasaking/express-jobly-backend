"use strict";

// REQUIRE DATABASE, USER, COMPANY, TOKEN
const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job");
const { createToken } = require("../helpers/tokens");

//BEFORE ALL, CREATE 3 USERS and 3 COMPANIES

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");

  await Company.create(
    {
      handle: "c1",
      name: "C1",
      numEmployees: 1,
      description: "Desc1",
      logoUrl: "http://c1.img",
    });
  await Company.create(
    {
      handle: "c2",
      name: "C2",
      numEmployees: 2,
      description: "Desc2",
      logoUrl: "http://c2.img",
    });
  await Company.create(
    {
      handle: "c3",
      name: "C3",
      numEmployees: 3,
      description: "Desc3",
      logoUrl: "http://c3.img",
    });

  await Job.create(
    {
      title: "J1",
      salary: "1000",
      equity: 0.1,
      companyHandle: "c1",
    });
  await Job.create(
    {
      title: "J2",
      salary: "2000",
      equity: 0.2,
      companyHandle: "c2",
    });
  await Job.create(
    {
      title: "J3",
      salary: "3000",
      equity: 0.3,
      companyHandle: "c3",
    });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: true,
  });
  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });
  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });
}

//START TRANSACTION
async function commonBeforeEach() {
  await db.query("BEGIN");
}

// DELETE AND ROLLBACK TRANSACTION
async function commonAfterEach() {
  await db.query("ROLLBACK");
}

//END DB SESSION
async function commonAfterAll() {
  await db.end();
}

//CREATE TOKEN for admin user
const u1Token = createToken({ username: "u1", isAdmin: true });

//CREATE TOKEN for non admin user
const u2Token = createToken({ username: "u2", isAdmin: false });

//EXPORTS
module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
};
