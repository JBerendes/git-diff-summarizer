#!/usr/bin/env node

const summarizeWork = require('../lib/summarizeWork');

// Handle command-line arguments and call the summarization logic
const args = process.argv.slice(2);
summarizeWork(args);