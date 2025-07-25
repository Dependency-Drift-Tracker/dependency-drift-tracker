export function parseFile(content) {
  return content.split('\n').map((line) => {
    if (line.trim() === '' || line.trim().startsWith('#')) {
      return;
    }
    return parseRepositoryLine(line);
  }).filter(r => !!r);
}

export function parseRepositoryLine(line) {
  const [url, flags] = line.split(',');
  const [repository, path] = url.split('#');
  return {
    repository,
    path: path || '',
    libyearFlags: JSON.parse(flags || '{}'),
  };
}

export function replaceRepositoryWithSafeChar(line) {
  return line.replaceAll(/(https?:\/\/)/g, '').replaceAll(/(-|\/|:|\.|#)/g, '-');
}
