import { readFile, writeFile, mkdtemp, access, constants } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import util from 'node:util';
import { exec as execNoPromise } from 'node:child_process';
import { chdir, cwd } from 'node:process';
import simpleGit from 'simple-git';
import { libyear } from 'francois-libyear';
import preferredPM from 'preferred-pm';
import semver from 'semver';
import { parseFile, parseRepositoryLine, replaceRepositoryWithSafeChar } from './utils.js';
import packageJSON from '../package.json' assert { type: 'json' };

export { parseFile, parseRepositoryLine, replaceRepositoryWithSafeChar };

const { satisfies } = semver;

const exec = util.promisify(execNoPromise);

const installCommand = {
  npm: 'npm install --ignore-scripts',
  yarn: 'yarn install --ignore-scripts',
  berry: 'yarn config set enableScripts false && yarn install',
  pnpm: 'pnpm install --ignore-scripts'
};

export async function generateWebsite(repositoryUrl, env = {}, websiteUrl = 'https://github.com/Dependency-Drift-Tracker/dependency-drift-tracker.git') {
  const tempDir = await cloneRepository(websiteUrl, simpleGit(), {}, { '--branch': `v${packageJSON.version}` });
  await exec('npm install --production=false', { cwd: tempDir });
  await exec('npm run build -- --public-url ./', { cwd: tempDir, env: {
    ...process.env,
    REPOSITORY_URL: repositoryUrl,
    ...env,
  }});
  return join(tempDir, 'dist');
}

export async function main() {
  const basePath = cwd();
  const filePath = join(basePath, 'repositories.txt');
  const content = await readFile(filePath, { encoding: 'utf8' });
  const lines = parseFile(content);
  const clonedRepositoriesPath = await cloneRepositories(lines);
  const installResult = await Promise.all(lines.map(async ({ repository, path }) => {
    const repositoryPath = clonedRepositoriesPath[repository];
    const packagePath = join(repositoryPath, path);
    const packageManager = await getPreferredPm(packagePath);
    await installDependencies(packagePath, packageManager);
    return {
      repository,
      path,
      packagePath,
      packageManager,
    };
  }));
  const indexResult = {};
  for await (const { repository, path, packagePath, packageManager } of installResult) {
    const line = `${repository}#${path}`;
    const result = await calculateRepository(packagePath, packageManager);
    const summary = createSummary(result);
    indexResult[line] = summary;
    await saveResult(basePath, line, summary, result);
  }
  await saveIndexFile(basePath, indexResult);
}

async function cloneRepositories(lines) {
  const clonedRepositoriesPath = {};
  for await (const { repository } of lines) {
    if (!clonedRepositoriesPath[repository]) {
      const repositoryPath = await cloneRepository(repository, simpleGit(), process.env);
      clonedRepositoriesPath[repository] = repositoryPath;
    }
  }
  return clonedRepositoriesPath;
}

export async function getPreferredPm(packagePath) {
  const pm = (await preferredPM(packagePath)).name;
  if (pm === 'yarn') {
    const { stdout } = await exec('yarn --version', { cwd: packagePath });
    return satisfies(stdout, "^0 || ^1") ? "yarn" : "berry";
  }
  return pm;
}

export function replaceRepositoryVariablesWithEnvVariables(repository, variables) {
  return Object.keys(variables).reduce((memo, key) => {
    return memo.replaceAll(`$${key}`, variables[key]);
  }, repository);
}

export async function cloneRepository(repository, simpleGit, env, gitOptions = {}) {
  const tempRepositoryPath = await mkdtemp(join(tmpdir(), sep));
  await simpleGit.clone(replaceRepositoryVariablesWithEnvVariables(repository, env), tempRepositoryPath, { '--depth': 1, ...gitOptions })
  return tempRepositoryPath;
}

function installDependencies(packagePath, packageManager) {
  return exec(installCommand[packageManager], { cwd: packagePath });
}

async function calculateRepository(packagePath, packageManager) {
  const previousDir = cwd();
  chdir(packagePath);
  const result = await libyear(packageManager, { all: true });
  chdir(previousDir);
  return result;
}

async function saveResult(basePath, line, summary, result) {
  await saveSummary(basePath, line, summary);
  await saveLastResult(basePath, line, result);
}

async function saveSummary(basePath, line, summary) {
  const filePath = join(basePath, 'data', `history-${replaceRepositoryWithSafeChar(line)}.json`);
  try {
    await access(filePath, constants.F_OK);
  } catch (e) {
    await writeFile(filePath, JSON.stringify([]));
  }
  const content = JSON.parse(await readFile(filePath, { encoding: 'utf8' }));
  content.push(summary);
  await writeFile(filePath, JSON.stringify(content));
}

async function saveLastResult(basePath, line, result) {
  const filePath = join(basePath, 'data', `last-run-${replaceRepositoryWithSafeChar(line)}.json`);
  await writeFile(filePath, JSON.stringify(result));
}

export function createSummary(result) {
  return result.reduce((memo, dep) => {
    memo.drift += dep.drift || 0;
    memo.pulse += dep.pulse || 0;
    return memo;
  }, { drift: 0, pulse: 0, date: new Date() });
}

async function saveIndexFile(basePath, indexResult) {
  const filePath = join(basePath, 'data', 'index.json');
  await writeFile(filePath, JSON.stringify(indexResult));
}
