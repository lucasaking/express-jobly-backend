"use strict";

/** Database setup for jobly. */

const { Client } = require("pg");
const { getDatabaseUri } = require("./config");
const types = require('pg').types
types.setTypeParser(1700, function (val) {
  return parseFloat(val);
});

const db = new Client({
  connectionString: getDatabaseUri(),
});

db.connect();

module.exports = db;
