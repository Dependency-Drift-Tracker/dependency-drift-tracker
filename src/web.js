import { parseFile, replaceRepositoryWithSafeChar } from './utils.mjs';

const PATH = 'https://raw.githubusercontent.com/1024pix/dependency-drift-tracker/main/';
let driftChart;
let pulseChart;

async function getRepositories() {
  const response = await fetch(`${PATH}/repositories.txt`);
  return response.text();
}

function displayNav(repositories) {
  const nav = document.getElementById("nav");
  repositories.forEach(({ repository, path }) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    const line = createLine({ repository, path });
    button.innerText = beautifyLine(line);
    button.dataset.line = createLine({ repository, path });
    button.addEventListener('click', (e) => {
      displayChart({ repository, path });
      selectButton({ repository, path });
    })
    li.appendChild(button);
    nav.appendChild(li);
  });
}

function createLine({ repository, path }) {
  return `${repository}#${path}`;
}

function beautifyLine(line) {
  return line.replaceAll('https://github.com/', '').replaceAll('.git', '');
}

async function displayChart({ repository, path }) {
  const line = createLine({ repository, path });
  const response = await fetch(`${PATH}/data/history-${replaceRepositoryWithSafeChar(line)}.json`);
  const data = await response.json();
  const labels = data.map((d, i) => i);

  const driftCtx = document.getElementById("driftChart");
  const pulseCtx = document.getElementById("pulseChart");
  if (driftChart) driftChart.destroy();
  if (pulseChart) pulseChart.destroy();

  driftChart = new Chart(driftCtx, {
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Dependency Drift',
          data: data.map(d => d.drift),
          backgroundColor: 'rgba(0, 63, 92, 0.2)',
          borderColor: 'rgba(0, 63, 92, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ({label, formattedValue}) => `${label} : ${formattedValue} libyears`
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


  pulseChart = new Chart(pulseCtx, {
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Dependency Pulse',
          data: data.map(d => d.pulse),
          backgroundColor: 'rgba(155, 209, 132, 0.2)',
          borderColor: 'rgba(155, 209, 132, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ({label, formattedValue}) => `${label} : ${formattedValue} libyears`
          }
        }
      },
      scales: {
        y: {
          position: "left",
        },
      },
    },
  })
}

function selectButton({ repository, path }) {
  const buttons = document.querySelectorAll("[data-line]");
  buttons.forEach(button => {
    button.classList.remove("selected");
  });
  const line = createLine({ repository, path });
  const button = document.querySelector(`[data-line="${line}"]`);
  button.classList.add("selected");
}

async function main() {
  const repositories = parseFile(await getRepositories());
  displayNav(repositories);
  await displayChart(repositories[0]);
  await selectButton(repositories[0]);
}

main();
