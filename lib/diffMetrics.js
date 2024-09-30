async function calculateDiffMetrics(commitHash) {
  const diffSummary = await git.diffSummary([commitHash + "^", commitHash]);
  return {
    linesAdded: diffSummary.insertions,
    linesDeleted: diffSummary.deletions,
    filesChanged: diffSummary.files.length
  };
}

module.exports = calculateDiffMetrics;