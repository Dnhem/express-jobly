"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Job = require("../models/job");

const router = express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company handle }
 *
 * Returns { job: { title, salary, equity, company handle } }
 *
 * Authorization required: login
 */
router.post("/", ensureLoggedIn, async (req, res, next) => {
  try {
    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { title, salary, equity, company handle} ] }
 * Authorization required: none
 * * Can filter on provided search filters:
 * - jobtitleLike (will find case-insensitive, partial matches 'dev' i.e. Web Developer)
 * - query string "minSalary" returns filtered job results with desired minimum salary
 * query string "hasEquity" only returns jobs containing equity
 */
router.get("/", async (req, res, next) => {
  try {
    const jobs = await Job.findAll(req.query);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/** GET /[jobId] => { job }
 *
 * Returns { id, title, salary, equity, company }
 *   where company is { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: none
 */
router.get("/:id", async (req, res, next) => {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});
/** PATCH /[jobId] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { title, salary, equity }
 *
 * Authorization required: login
 */

router.patch("/:id", ensureLoggedIn, async (req, res, next) => {
  try {
    const job = await Job.update(req.params.id, req.body);
    return res.json(job);
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", ensureLoggedIn, async (req, res, next) => {
  try {
    await Job.delete(req.params.id);
    return res.json({ msg: "Job removed." });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
