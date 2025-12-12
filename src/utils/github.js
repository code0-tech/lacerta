const AsyncManager = require('../singleton/AsyncManager');
const Constants = require('../../data/constants');
const config = require('./../../config.json');
const fetch = require('node-fetch');

const getToken = (code) => {
  return new Promise((resolve) => {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
    });

    fetch(Constants.GIT.URL.ACCESS_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params,
    })
      .then(response => response.json())
      .then(data => {
        resolve(data.access_token)
      })
      .catch(error => console.error('Error:', error));
  })
};

const getGithubUserInfo = async (token) => {
  const query = `
  {
    viewer {
      login
      contributionsCollection(
        organizationID: "${config.github.orgaid}"
      ) {
        pullRequestContributionsByRepository {
          contributions(first: 100) {
            nodes {
              occurredAt
              pullRequest { state }
            }
          }
          repository { name }
        }
        commitContributionsByRepository {
          contributions(first: 100) {
            nodes {
              occurredAt
              commitCount
            }
          }
          repository { name }
        }
      }
    }
  }
  `;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  return fetch(Constants.GIT.URL.GRAPHQL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  })
    .then(response => response.json())
    .catch(error => console.error('Error:', error));
};

const calculateTotalCounts = (contributions) => {
  const totalCounts = {};

  contributions.forEach((repo) => {
    const repositoryName = repo.repository.name;

    if (!totalCounts[repositoryName]) {
      totalCounts[repositoryName] = { commitCount: 0, pullRequestCount: 0 };
    }

    repo.contributions.nodes.forEach((contribution) => {
      totalCounts[repositoryName].commitCount += contribution.commitCount || 0;
    });

    repo.contributions.nodes.forEach((contribution) => {
      if (contribution.pullRequest && contribution.pullRequest.state === 'MERGED') {
        totalCounts[repositoryName].pullRequestCount += 1;
      }
    });
  });

  return totalCounts;
};

const filterCommits = (data) => {
  const totalCounts = calculateTotalCounts(data.pullRequestContributionsByRepository.concat(data.commitContributionsByRepository));

  const contributionsList = Object.entries(totalCounts).map(([repository, counts]) => ({
    repository,
    commitCount: counts.commitCount,
    pullRequestCount: counts.pullRequestCount
  }));

  const totalPullRequests = contributionsList.reduce((total, contribution) => total + contribution.pullRequestCount, 0);
  const totalCommitContributions = contributionsList.reduce((total, contribution) => total + contribution.commitCount, 0);

  return {
    contributions: contributionsList,
    totalPullRequests,
    totalCommitContributions
  };
};

const checkOpenContributor = async (data, code, client) => {

  const token = await getToken(code);

  const graphQlInfo = await getGithubUserInfo(token);

  const resolvePacket = {
    name: graphQlInfo.data.viewer.login,
    github: filterCommits(graphQlInfo.data.viewer.contributionsCollection)
  }

  AsyncManager.resolveAction(data.awaitCodeId, resolvePacket);
};

module.exports = { checkOpenContributor };