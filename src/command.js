#!/usr/bin/env node

const develop = require('./index.js').develop;

const args = process.argv.slice(2);
const noFetch = args.indexOf('--no-fetch') > -1;

develop({noFetch: noFetch});