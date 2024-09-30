const simpleGit = require('simple-git');
const git = simpleGit();
/// in lib/summarizeWithCopilot.js
const { summarizeWithCopilot } = require('./summarizeWithCopilot');



// Function to calculate lines added, deleted, and files changed
async function calculateDiffMetrics(commitHash) {
  const diffSummary = await git.diffSummary([commitHash + "^", commitHash]);
  const { insertions, deletions, files } = diffSummary;

  return {
    linesAdded: insertions,
    linesDeleted: deletions,
    filesChanged: files.length
  };
}

// Step 1: Get commits grouped by author and date with metrics
async function getCommitsGroupedByAuthorAndDate(startDate, endDate) {
  const commits = await git.log(formatDateRange(startDate, endDate));
  const groupedCommits = {};

  for (const commit of commits.all) {
    const commitDate = commit.date.split('T')[0]; // Extract the date (YYYY-MM-DD)
    const diff = await git.diff([commit.hash + "^", commit.hash]);
    const metrics = await calculateDiffMetrics(commit.hash);

    if (!groupedCommits[commitDate]) {
      groupedCommits[commitDate] = {};
    }

    if (!groupedCommits[commitDate][commit.author_name]) {
      groupedCommits[commitDate][commit.author_name] = {
        commits: [],
        totalLinesAdded: 0,
        totalLinesDeleted: 0,
        totalFilesChanged: 0,
        totalCommits: 0
      };
    }

    groupedCommits[commitDate][commit.author_name].commits.push({
      message: commit.message,
      date: commit.date,
      diff,
      linesAdded: metrics.linesAdded,
      linesDeleted: metrics.linesDeleted,
      filesChanged: metrics.filesChanged
    });

    // Update the metrics for the author on this day
    groupedCommits[commitDate][commit.author_name].totalLinesAdded += metrics.linesAdded;
    groupedCommits[commitDate][commit.author_name].totalLinesDeleted += metrics.linesDeleted;
    groupedCommits[commitDate][commit.author_name].totalFilesChanged += metrics.filesChanged;
    groupedCommits[commitDate][commit.author_name].totalCommits += 1;
  }

  return groupedCommits;
}

// Step 2: Summarize commits with metrics for each day and author
async function summarizeDailyWork(groupedCommits) {
  for (const [date, authors] of Object.entries(groupedCommits)) {
    console.log(`--- Summary for ${date} ---`);

    for (const [author, summary] of Object.entries(authors)) {
      let combinedDiffs = '';
      const { totalLinesAdded, totalLinesDeleted, totalFilesChanged, totalCommits, commits } = summary;

      // Combine diffs for all commits from this author
      for (const { message, diff } of commits) {
        combinedDiffs += `Commit: ${message}\nDiff:\n${diff}\n\n`;
      }

      // Summarize combined diffs for this author on this date
      const summaryText = await summarizeWithCopilot(combinedDiffs);

      // Output summary with metrics
      console.log(`Author: ${author}\nTotal Commits: ${totalCommits}`);
      console.log(`Lines Added: ${totalLinesAdded}, Lines Deleted: ${totalLinesDeleted}`);
      console.log(`Files Changed: ${totalFilesChanged}\n`);
      console.log(`Summary of work done on ${date}:\n${summaryText}`);
    }
  }
}

// Step 3: Main function to handle input (range, week, month) and export daily summaries
async function summarizeWork({ startDate, endDate, weekNumber, month, year, exportDailySummaries = false }) {
  let dateRange;

  if (weekNumber && year) {
    const { startDate: weekStartDate, endDate: weekEndDate } = getDateRangeByWeek(weekNumber, year);
    dateRange = { startDate: weekStartDate.toISOString().split('T')[0], endDate: weekEndDate.toISOString().split('T')[0] };
  } else if (month && year) {
    const { startDate: monthStartDate, endDate: monthEndDate } = getDateRangeByMonth(month, year);
    dateRange = { startDate: monthStartDate.toISOString().split('T')[0], endDate: monthEndDate.toISOString().split('T')[0] };
  } else if (startDate && endDate) {
    dateRange = { startDate, endDate };
  } else {
    throw new Error("Invalid input: Please provide a valid date range, week, or month.");
  }

  const groupedCommits = await getCommitsGroupedByAuthorAndDate(dateRange.startDate, dateRange.endDate);

  if (exportDailySummaries) {
    await summarizeDailyWork(groupedCommits);
  } else {
    // If not exporting daily summaries, summarize work across the whole range as before
    await summarizeWorkByAuthor(dateRange);
  }
}

// Example usage for exporting daily summaries with metrics
const input = {
  startDate: '2024-09-23',
  endDate: '2024-09-29',
  exportDailySummaries: true,
};

summarizeWork(input).catch(err => console.error(err));
