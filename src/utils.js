export function parseFile(content) {
  return content.split('\n').map((line) => {
    if (line.trim() === '' || line.trim().startsWith('#')) {
      return;
    }
    return parseRepositoryLine(line);
  }).filter(r => !!r);
}

export function parseRepositoryLine(line) {
  const [repository, path] = line.split('#');
  return {
    repository,
    path: path || '',
  };
}

export function replaceRepositoryWithSafeChar(line) {
  return line.replaceAll(/(https?:\/\/)/g, '').replaceAll(/(-|\/|:|\.|#)/g, '-');
}
