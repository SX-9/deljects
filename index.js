#! /bin/node

import chalk from "chalk";
import inquirer from "inquirer";
import { Octokit } from "octokit";

console.clear();
const sleep = (m) => new Promise((r) => setTimeout(r, m));

const prompts = await inquirer.prompt([
  {
    type: "password",
    name: "access_token",
    message: `Github Access Token (${chalk.underline(
      "With Repo Read And Delete Permissions"
    )}):`,
    validate(value) {
      return value.startsWith("ghp_");
    },
  },
  {
    type: "input",
    name: "continue",
    message: `${chalk.yellow("Warning:")} Next Step Wil Fetch ${chalk.red(
      "ALL"
    )} Of Your Github Repos, Continue?`,
    default(a) {
      return "Yes";
    },
  },
]);

if (prompts.continue.toLowerCase() !== "yes") {
  console.log(`${chalk.red("!")} ${chalk.bold("Canceled.")}`);
  process.exit(1);
}

const github = new Octokit({
  auth: prompts.access_token,
});
const user = await github.rest.users.getAuthenticated();
console.log(
  `${chalk.yellow("*")} ${chalk.bold(
    `Logged In As ${chalk.green(user.data.login)}`
  )}`
);

const rawReposRes = await fetch(user.data.repos_url);
const rawRepos = await rawReposRes.json();
let repos = [];

rawRepos.forEach((repo) =>
  repos.push({
    owner: repo.owner.login,
    repo_name: repo.name,
    name: `${repo.owner.login}/${repo.name} - ${repo.description}`,
  })
);
console.log(
  `${chalk.yellow("*")} ${chalk.bold(
    `Found ${chalk.green(repos.length == 30 ? '30+' : repos.length)} Repos`
  )}`
);

await sleep(2000);
console.clear();

const prompts2 = await inquirer.prompt([
  {
    type: "checkbox",
    name: "trashed",
    message: `Select Repos To ${chalk.red("Delete")}:`,
    choices: repos,
  },
  {
    type: "input",
    name: "continue",
    message: `${chalk.yellow("Warning:")} Next Step Will Delete ${chalk.red(
      "ALL THE ABOVE"
    )} Github Repos, Continue?`,
    default() {
      return "Yes";
    },
  },
]);

if (prompts2.continue.toLowerCase() !== "yes") {
  console.log(`${chalk.red("!")} ${chalk.bold("Canceled.")}`);
  process.exit(1);
}
console.log(`${chalk.red("!")} ${chalk.bold("DELETING REPOSITORIES....")}`);

let del = [];
prompts2.trashed.forEach((trash) =>
  del.push(repos.filter((entry) => entry.name === trash))
);

del.forEach(async (repo, index) => {
  await github.rest.repos.delete({
    owner: repo[0].owner,
    repo: repo[0].repo_name,
  });
  console.log(
    `${chalk.red("!")} ${chalk.bold(`${index + 1}/${del.length} ${chalk.red("Deleted:")} ${repo[0].name}`)}`
  );
});
