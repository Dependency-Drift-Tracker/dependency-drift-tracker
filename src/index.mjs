import { readFile, writeFile, mkdtemp, access, constants } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { sep } from 'node:path';
import util from 'node:util';
import { exec as execNoPromise } from 'node:child_process';
import { chdir, cwd } from 'node:process';
import simpleGit from 'simple-git';
import { libyear } from 'francois-libyear';
import preferredPM from 'preferred-pm';
import semver from 'semver';
import { parseFile, parseRepositoryLine, replaceRepositoryWithSafeChar } from './utils.mjs';

export { parseFile, parseRepositoryLine, replaceRepositoryWithSafeChar };

const { satisfies } = semver;

const exec = util.promisify(execNoPromise);

const installCommand = {
  npm: 'npm install --ignore-scripts',
  yarn: 'yarn install --ignore-scripts',
  berry: 'yarn config set enableScripts false && yarn install',
  pnpm: 'pnpm install --ignore-scripts'
};

export async function main() {
  const filePath = new URL('../repositories.txt', import.meta.url);
  const content = await readFile(filePath, { encoding: 'utf8' });
  const lines = parseFile(content);
  const clonedRepositoriesPath = await cloneRepositories(lines);
  const installResult = await Promise.all(lines.map(async ({ repository, path }) => {
    const repositoryPath = clonedRepositoriesPath[repository];
    const packagePath = `${repositoryPath}${sep}${path}`;
    const packageManager = await getPreferredPm(packagePath);
    await installDependencies(packagePath, packageManager);
    return {
      repository,
      path,
      packagePath,
      packageManager,
    };
  }));
  for await (const { repository, path, packagePath, packageManager } of installResult) {
    const result = await calculateRepository(packagePath, packageManager);
    const summary = createSummary(result);
    await saveResult(`${repository}#${path}`, summary, result);
  }
}

async function cloneRepositories(lines) {
  const clonedRepositoriesPath = {};
  for await (const { repository } of lines) {
    if (!clonedRepositoriesPath[repository]) {
      const repositoryPath = await cloneRepository(repository, simpleGit());
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

export async function cloneRepository(repository, simpleGit) {
  const tempRepositoryPath = await mkdtemp(`${tmpdir()}${sep}`);
  await simpleGit.clone(repository, tempRepositoryPath, { '--depth': 1 })
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

async function saveResult(line, summary, result) {
  await saveSummary(line, summary);
  await saveLastResult(line, result);
}

async function saveSummary(line, summary) {
  const filePath = `data/history-${replaceRepositoryWithSafeChar(line)}.json`;
  try {
    await access(filePath, constants.F_OK);
  } catch (e) {
    await writeFile(filePath, JSON.stringify([]));
  }
  const content = JSON.parse(await readFile(filePath, { encoding: 'utf8' }));
  content.push(summary);
  await writeFile(filePath, JSON.stringify(content));
}

async function saveLastResult(line, result) {
  const filePath = `data/last-run-${replaceRepositoryWithSafeChar(line)}.json`;
  await writeFile(filePath, JSON.stringify(result));
}

export function createSummary(result) {
  return result.reduce((memo, dep) => {
    memo.drift += dep.drift || 0;
    memo.pulse += dep.pulse || 0;
    return memo;
  }, { drift: 0, pulse: 0 });
}
