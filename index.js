"use strict";
const { execFileSync } = require("child_process");
const path = require("path");

const CLI = path.join(__dirname, "bin", "cli.js");

exports.balance = (args = []) => execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8", timeout: 15000 }).trim();
exports.status = () => exports.balance(["status"]);
exports.full = () => exports.balance(["full"]);
