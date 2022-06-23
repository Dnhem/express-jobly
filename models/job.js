"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { get } = require("./company");
const { isQstringEmpty } = require("../helpers/checkResponse");
/** Related functions for jobs */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * job should be { title, salary, equity, company_handle }
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle) VALUES ($1, $2, $3, $4)
    RETURNING title, salary, equity, company_handle AS "companyHandle"`,
      [ title, salary, equity, companyHandle ]
    );
    const job = result.rows[0];

    return job;
  }

  /** GET /  =>
 *   { jobs: [ { title, salary, equity, company handle} ] }
 *
 * Authorization required: none
 */
  static async findAll(qString) {
    let query = `SELECT title, salary, equity, company_handle AS "companyHandle" FROM jobs`;

    if (isQstringEmpty(query)) {
      query = `${query}`;
    } else if (qString.minSalary) {
      query = `${query} WHERE salary >= ${+qString.minSalary}`;
    } else if (qString.hasEquity) {
      query = `${query} WHERE equity > 0`;
    } else if (qString.title) {
      query = `${query} WHERE LOWER(title) LIKE '%${qString.title}%';`;
    }
    return (await db.query(query)).rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if not found.
   **/
  static async get(id) {
    const jobRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE id = $1`,
      [ id ]
    );
    const job = jobRes.rows[0];
    // query associated company and attached it as a property "company" to job query object
    if (!job) throw new NotFoundError(`Job with id: ${id} not found.`);
    const companyRes = await db.query(
      `SELECT handle, name, num_employees AS "numEmployees", description, logo_url AS "logoUrl" FROM companies WHERE handle = $1`,
      [ job.companyHandle ]
    );
    const company = companyRes.rows[0];

    job.company = company;
    return job;
  }

  static async update(jobId, data) {
    const job = await db.query(
      `UPDATE jobs SET title = $1, salary = $2, equity = $3 WHERE id = $4 RETURNING id, title, salary, equity, company_handle as "companyHandle"`,
      [ data.title, data.salary, data.equity, jobId ]
    );
    return job.rows[0];
  }

  static async delete(jobId) {
    await db.query(`DELETE FROM jobs WHERE id =$1`, [ jobId ]);
  }
}

module.exports = Job;
