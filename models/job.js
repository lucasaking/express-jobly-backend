const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


require("colors");

class Job {

  /** Create a jon (from data), update db, return new job data.
  *
  * data should be { title, salary, equity, companyHandle }
  *
  * Returns { title, salary, equity, companyHandle }
  *
  * Throws BadRequestError if job already in database for a company.
  * */

  static async create({ title, salary, equity, companyHandle }) {
    try {
      const duplicateCheck = await db.query(
        `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = $1 AND salary = $2 AND equity = $3 AND company_handle = $4`,
        [title, salary, equity, companyHandle]);

      if (duplicateCheck.rows[0])
        throw new BadRequestError(`Job already exists: ${title, salary, equity, companyHandle}`);

      const result = await db.query(
        `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle,
        ],
      );
      const job = result.rows[0];
      // if (!job)
      //   throw new BadRequestError(`Invalid input : ${title, salary, equity, companyHandle}`);

      return job;
    } catch (err) {
      throw new BadRequestError(`Invalid input : ${title, salary, equity, companyHandle}`, err);
    }
  }



  /************************************** findAll */

  static async findAll(filterObj) {

    let whereClause = "";
    let values = [];
    let count = 1;

    //Build where clause string dynamically
    for (let key in filterObj) {
      if (key === "minSalary") {
        whereClause += whereClause === "" ? "WHERE" : "AND";
        values.push(filterObj[key]);
        whereClause += ` salary >= $${count++} `;
      }

      if (key === "hasEquity") {
        if (filterObj[key]) { //if true, filter jobs with equity > 0
          whereClause += whereClause === "" ? "WHERE" : "AND";
          values.push(0);
          whereClause += ` equity > $${count++} `;
        }
      }

      if (key === "title") {
        whereClause += whereClause === "" ? "WHERE" : "AND";
        values.push(`%${filterObj[key]}%`);
        whereClause += ` title ILIKE $${count++} `;
      }
    }

    console.log("WHEREEEEE===>".green, whereClause);
    const jobsRes = await db.query(
      `SELECT id,
              title, 
              salary, 
              equity, 
              company_handle AS "companyHandle"
           FROM jobs
         ${whereClause}
         ORDER BY title`, values);

    return jobsRes.rows;
  }

  /** Given a job id, return data about jobs available from job.
  *
  * Returns { title, salary, equity, job_handle }
  *   where jobs is [{ id, title, salary, equity, jobHandle }, ...]
  *
  * Throws NotFoundError if not found.
  **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job id: ${id}`);

    return job;
  }


  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, job_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {

    const ignoreKeys = ["companyHandle", "id"];

    ignoreKeys.forEach((key) => {
      if (key in data) delete data[key];
    });

    const { setCols, values } = sqlForPartialUpdate(
      data, {});
    const jobIdx = "$" + (values.length + 1);


    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${jobIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    console.log("RESULTTTTT UPDATED ROW-->".yellow, job);

    if (!job) throw new NotFoundError(`No job id: ${id}`);

    return job;
  }


  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]);
    const jobId = result.rows[0];

    if (!jobId) throw new NotFoundError(`No job id: ${id}`);
  }
}

module.exports = Job;