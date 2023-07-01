import { readFile, writeFile, mkdtemp, access, constants } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { sep } from 'node:path';
import util from 'node:util';
import { exec as execNoPromise } from 'node:child_process';
import { chdir } from 'node:process';
import simpleGit from 'simple-git';
import { libyear } from 'francois-libyear';
import preferredPM from 'preferred-pm';
import semver from 'semver';

const { satisfies } = semver;

const exec = util.promisify(execNoPromise);

async function main() {
  const filePath = new URL('../repositories.txt', import.meta.url);
  const content = await readFile(filePath, { encoding: 'utf8' });
  content.split('\n').forEach(async (line) => {
    if (line.trim() === '' || line.trim().startsWith('#')) {
      return;
    }
    try {
      const { repository, path } = parseRepositoryLine(line);
      const repositoryPath = await cloneRepository(repository, simpleGit());
      const packagePath = `${repositoryPath}${sep}${path}`;
      const { pm, forLibYear } = await getPreferredPm(packagePath);
      await installDependencies(packagePath, pm);
      const result = await calculateRepository(packagePath, forLibYear);
      const summary = createSummary(result);
      await saveResult(line, summary, result);
    } catch (err) {
      console.error(err.message);
    }
  });
}

export async function getPreferredPm(packagePath) {
  const pm = (await preferredPM(packagePath)).name;
  let forLibYear = pm;
  if (pm === 'yarn') {
    const { stdout } = await exec('yarn --version', { cwd: packagePath });
    forLibYear = satisfies(stdout, "^0 || ^1") ? "yarn" : "berry";
  }
  return {
    pm,
    forLibYear,
  };
}

export function parseRepositoryLine(line) {
  const [repository, path] = line.split('#');
  return {
    repository,
    path: path || '',
  };
}

export async function cloneRepository(repository, simpleGit) {
  const tempRepositoryPath = await mkdtemp(`${tmpdir()}${sep}`);
  await simpleGit.clone(repository, tempRepositoryPath)
  return tempRepositoryPath;
}

function installDependencies(packagePath, packageManager) {
  return exec(`${packageManager} install`, { cwd: packagePath });
}

function calculateRepository(packagePath, packageManager) {
  chdir(packagePath);
  return libyear(packageManager, { all: true });
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

export function replaceRepositoryWithSafeChar(line) {
  return line.replaceAll(/(-|\/|:|\.|#)/g, '-');
}

export function createSummary(result) {
  return result.reduce((memo, dep) => {
    memo.drift += dep.drift;
    memo.pulse += dep.pulse;
    return memo;
  }, { drift: 0, pulse: 0 });
}

if (process.env.NODE_ENV !== 'test') {
  main();
}
