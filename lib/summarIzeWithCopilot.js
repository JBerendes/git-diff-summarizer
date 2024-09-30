const { exec } = require('child_process');

async function summarizeWithCopilot(diff) {
  return new Promise((resolve, reject) => {
    const command = `gh copilot summarize --input "${diff}"`;
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

module.exports = summarizeWithCopilot;