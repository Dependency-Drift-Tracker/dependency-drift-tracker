import fs from "node:fs/promises";

export function fillMissingDates(historyData) {
  for (let i = historyData.length - 1; i >= 0; i--) {
    if (!historyData[i].date) {
      const date = new Date(historyData[i + 1].date);
      const previousDate = new Date(date.setDate(date.getDate() - 1));
      historyData[i].date = previousDate.toISOString();
    }
  }
  return historyData;
}

export async function loadHistory(filePath) {
  return (await import(filePath, {assert: {type: "json"}})).default;
}

export async function loadHistoryFiles(folderPath) {
  const folderContent = await fs.readdir(folderPath);

  return Promise.all(
    folderContent.filter(fileName => fileName.endsWith('.json') && fileName.startsWith('history'))
      .map(async (fileName) => {
        const filePath = `${folderPath}/${fileName}`;
        const content = await loadHistory(filePath);
        return {filePath, content};
      })
  );
}

export async function writeHistoryFiles(history) {
  for await (let file of history) {
    await fs.writeFile(file.filePath, JSON.stringify(file.content));
  }
}

export async function main(folderPath) {
  const historyFiles = await loadHistoryFiles(folderPath);
  console.log('read history files', historyFiles.length);

  const history = historyFiles.map(file => {
    file.content = fillMissingDates(file.content);
    return file;
  });
  console.log('updated history files', history.length);

  await writeHistoryFiles(history);
  console.log('done')
}