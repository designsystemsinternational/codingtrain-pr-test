const { Octokit, App } = require("octokit");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");

const runScript = async () => {
  const unix = Math.floor(Date.now() / 1000);
  const owner = "designsystemsinternational";
  const repo = "codingtrain-pr-test";

  const postInfo = {
    title: "Something",
    authorName: "Rune Madsen",
    authorUrl: "https://runemadsen.com",
    authorEmail: "rune@runemadsen.com",
    url: "https://runemadsen.github.io/rune.js/",
    challenge: "01-test",
  };

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  // Get the SHA of the main branch
  const shaRes = await octokit.request(
    `GET /repos/${owner}/${repo}/git/ref/heads/main`
  );
  const mainSha = shaRes.data.object.sha;

  // Make a new branch named after the user
  const branchName = slugify(
    `showcase-${slugify(postInfo.authorName)}-${unix}`.toLowerCase()
  );
  const branchRes = await octokit.request(
    `POST /repos/${owner}/${repo}/git/refs`,
    {
      ref: `refs/heads/${branchName}`,
      sha: mainSha,
    }
  );

  // Add the JSON file
  const contributionJSON = {
    title: postInfo.title,
    author: {
      name: postInfo.authorName,
      url: postInfo.authorUrl,
    },
    url: postInfo.url,
  };
  const jsonContent = btoa(JSON.stringify(contributionJSON, null, 2));

  const jsonPath = `content/videos/challenges/${postInfo.challenge}/showcase/contribution-${unix}.json`;
  const imagePath = `content/videos/challenges/${postInfo.challenge}/showcase/contribution-${unix}.png`;

  const jsonRes = await octokit.request(
    `PUT /repos/${owner}/${repo}/contents/${jsonPath}`,
    {
      branch: branchName,
      message: "Added contribution JSON file",
      committer: {
        name: postInfo.authorName,
        email: postInfo.authorEmail,
      },
      content: jsonContent,
    }
  );

  // Add the image
  // TODO: Run image through Sharp resize?
  // TODO: Run image through PNG optimize?
  // TODO: Change to support FORM post
  const imageBytes = await fs.readFileSync(
    path.join(__dirname, "boss.png"),
    "binary"
  );
  const imageBuffer = Buffer.from(imageBytes, "binary");
  const imageContent = imageBuffer.toString("base64");

  const imageRes = await octokit.request(
    `PUT /repos/${owner}/${repo}/contents/${imagePath}`,
    {
      branch: branchName,
      message: "Added contribution PNG file",
      committer: {
        name: postInfo.authorName,
        email: postInfo.authorEmail,
      },
      content: imageContent,
    }
  );

  // Make a PR to main
  const prRes = await octokit.request(`POST /repos/${owner}/${repo}/pulls`, {
    title: `Passenger showcase contribution from ${postInfo.authorName}`,
    body: "Yay!",
    head: branchName,
    base: "main",
  });
};

runScript();
