import express from "express";
import fetch from "node-fetch";

const port = process.env.port || 3000;

const app = express();

// Set the view engine and middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Categorize commits based on their type
const categorizeCommits = (commits) => {
  // Initialize an object to store categorized commits
  const categorizedCommits = {
    feat: [],
    fix: [],
    chore: [],
    docs: [],
    style: [],
    refactor: [],
    test: [],
    other: [],
  };

  // Iterate through commits and categorize them based on their type
  commits.forEach((commit) => {
    // Match the commit message against the conventional commit format
    const match = commit.commit.message.match(
      /^(feat|fix|chore|docs|style|refactor|test)(\([^)]*\))?/
    );
    const type = match ? match[1] : "other"; // Get the commit type or default to 'other'
    categorizedCommits[type].push(commit); // Add the commit to its corresponding category
  });

  return categorizedCommits;
};

// Make GitHub API call and return data for success and throw error for failure
const makeGitHubApiCall = async (url, resource) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${resource} not found`);
  }
  return await response.json();
};

// Route for homepage
app.get("/", (req, res) => {
  res.render("index", {
    releaseDetails: null,
    categorizedCommits: null,
    error: null,
  });
});

//Route to handle form submission and fetch release data and commits
app.post("/", async (req, res) => {
  // Get params from request body
  const { owner, repo, tag } = req.body;

  try {
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

    const releaseDetails = await makeGitHubApiCall(
      `${baseUrl}/releases/tags/${tag}`,
      "Release"
    );

    const tagDetails = await makeGitHubApiCall(
      `${baseUrl}/git/refs/tags/${tag}`,
      "Tag"
    );
    const commitSHA = tagDetails.object.sha;

    const commitDetails = await makeGitHubApiCall(
      `${baseUrl}/commits?sha=${commitSHA}`,
      "Commit"
    );

    // Categorize commits based on Conventional Commit conventions
    const categorizedCommits = categorizeCommits(commitDetails);

    res.render("index", { releaseDetails, categorizedCommits, error: null });
  } catch (error) {
    console.error(error);
    res.render("index", {
      releaseDetails: null,
      categorizedCommits: null,
      error: `Error fetching release notes. ERROR: ${error.message}`,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
