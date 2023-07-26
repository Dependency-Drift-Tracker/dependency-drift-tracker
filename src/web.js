import Chart from 'chart.js/auto';
import DataTable from 'datatables.net-bs';
import 'datatables.net-bs/css/dataTables.bootstrap.css'
import { parseFile, replaceRepositoryWithSafeChar } from './utils.mjs';

const PATH = process.env.REPOSITORY_URL || `https://raw.githubusercontent.com/1024pix/dependency-drift-tracker/main`;

let driftChart;
let pulseChart;
let table;
const historyFiles = {};

function formatFloat(number) {
 return Number.isInteger(number) ? number : number?.toFixed(2);
}

const createLink = (href, content) => {
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = content;
  return a;
}

async function getRepositories() {
  const response = await fetch(`${PATH}/repositories.txt`);
  return response.text();
}

function displayNav(repositories) {
  const nav = document.getElementById("nav");
  repositories.forEach(({ repository, path }) => {
    const li = document.createElement("li");
    li.classList.add('nav-item');
    const link = document.createElement("a");
    link.classList.add('nav-link', 'd-flex');
    const line = createLine({ repository, path });
    link.setAttribute('href', `#${line}`)
    link.dataset.line = line;
    link.addEventListener('click', (e) => {
      displayResult({ repository, path });
      selectButton({ repository, path });
    });
    const span = document.createElement('span');
    span.classList.add('flex-grow-1');
    span.textContent = beautifyLine(line);
    link.appendChild(span);
    historyFiles[line].then((data) => {
      const badge = document.createElement('span');
      badge.classList.add('badge', 'bg-secondary', 'align-self-center');
      badge.textContent = formatFloat(data[data.length - 1].drift);
      link.appendChild(badge);
    });
    li.appendChild(link);
    nav.appendChild(li);
  });
}

function createLine({ repository, path }) {
  return `${repository}#${path}`;
}

function beautifyLine(line) {
  return line.replaceAll('https://github.com/', '').replaceAll('.git', '');
}

async function displayResult({ repository, path }) {
  const line = createLine({ repository, path });
  displayTitleAndSummary({ repository, path, line });
  displayChart(line);
  displayLastRun(line);
}

async function displayTitleAndSummary({ repository, path, line }) {
  const data = await historyFiles[line];
  const lastResult = data[data.length - 1]
  const title = document.getElementById('title');
  title.textContent = '';
  title.appendChild(createLink(repository, beautifyLine(line)));
  const driftSummary = document.getElementById("driftSummary");
  driftSummary.textContent = `${formatFloat(lastResult.drift)} libyears`;
  const pulseSummary = document.getElementById("pulseSummary");
  pulseSummary.textContent = `${formatFloat(lastResult.pulse)} libyears`;
}


function createChart(ctx, label, data, property, baseColor) {
  const labels = data.map((d, i) => d.date || i);
  return new Chart(ctx, {
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label,
          data: data.map(d => formatFloat(d[property])),
          backgroundColor: `rgba(${baseColor.join()}, 0.2)`,
          borderColor: `rgba(${baseColor.join()}, 1)`,
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ({label, formattedValue}) => `${formattedValue} libyears`
          }
        }
      },
      scales: {
        y: {
          position: "left",
          beginAtZero: true,
          suggestedMin: 0,
        },
      },
    },
  });
}

async function displayChart(line) {
  const data = await historyFiles[line];

  const driftCtx = document.getElementById("driftChart");
  const pulseCtx = document.getElementById("pulseChart");
  if (driftChart) driftChart.destroy();
  if (pulseChart) pulseChart.destroy();

  driftChart = createChart(driftCtx, 'Dependency Drift', data, 'drift', [0, 63, 92]);
  pulseChart = createChart(pulseCtx, 'Dependency Pulse', data, 'pulse', [155, 209, 132]);
}

async function displayLastRun(line) {
  if (table) table.destroy();
  const response = await fetch(`${PATH}/data/last-run-${replaceRepositoryWithSafeChar(line)}.json`);
  const data = await response.json();

  const tbody = document.getElementsByTagName('tbody')[0];
  tbody.textContent = '';
  const createTd = (tr, content) => {
    const td = document.createElement('td');
    td.appendChild(content instanceof Node ? content : document.createTextNode(content === undefined ? '' : content));
    tr.appendChild(td);
  }
  data.forEach((d) => {
    const tr = document.createElement('tr');
    createTd(tr, createLink(`https://www.npmjs.com/package/${d.dependency}`, d.dependency));
    createTd(tr, formatFloat(d.drift));
    createTd(tr, formatFloat(d.pulse));
    tbody.appendChild(tr);
  });

  table = new DataTable('#rawResult', {
    paging: false,
    searching: false,
    info: false,
  });
}

function selectButton({ repository, path }) {
  const links = document.querySelectorAll("[data-line]");
  links.forEach(link => {
    link.classList.remove("active");
  });
  const line = createLine({ repository, path });
  const link = document.querySelector(`[data-line="${line}"]`);
  link.classList.add("active");
}

async function main() {
  const repositories = parseFile(await getRepositories());
  repositories.forEach(({ repository, path }) => {
    const line = createLine({ repository, path });
    historyFiles[line] = fetch(`${PATH}/data/history-${replaceRepositoryWithSafeChar(line)}.json`).then(r => r.json());
  });
  displayNav(repositories);
  let selectedRepository = repositories[0];
  if (location.hash.length > 0) {
    const hash = location.hash.slice(1);
    repositories.forEach((param) => {
      const line = createLine(param);
      if (line === hash) {
        selectedRepository = param;
      }
    });
  }
  displayResult(selectedRepository);
  selectButton(selectedRepository);
}

main();
