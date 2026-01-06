const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
const tooltip = document.getElementById("tooltip");

/* ---------------- Canvas resize ---------------- */
canvas.width = window.innerWidth - 280;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth - 280;
  canvas.height = window.innerHeight;
});

/* ---------------- Config ---------------- */
const MAX_POINTS = 50;
let running = true;
let interval = 500;

/* ---------------- Themes ---------------- */
const themes = {
  light: {
    bg: "#ffffff",
    grid: "#e0e0e0",
    series: ["#e53935", "#1e88e5", "#43a047"]
  },
  dark: {
    bg: "#121212",
    grid: "#333",
    series: ["#ff5252", "#40c4ff", "#69f0ae"]
  },
  contrast: {
    bg: "#000000",
    grid: "#777",
    series: ["#ff0000", "#00ff00", "#00ffff"]
  }
};

let currentTheme = themes.light;

/* ---------------- Data series ---------------- */
let series = [
  { data: [], colorIndex: 0 },
  { data: [], colorIndex: 1 },
  { data: [], colorIndex: 2 }
];

/* ---------------- Utils ---------------- */
function randomValue() {
  const min = +document.getElementById("minVal").value;
  const max = +document.getElementById("maxVal").value;
  return Math.random() * (max - min) + min;
}

function updateData() {
  series.forEach(s => {
    s.data.push(randomValue());
    if (s.data.length > MAX_POINTS) s.data.shift();
  });
}

function movingAverage(data, window = 3) {
  return data.map((_, i, arr) => {
    const slice = arr.slice(Math.max(0, i - window), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

/* ---------------- Drawing helpers ---------------- */
function drawGrid() {
  if (!document.getElementById("gridToggle").checked) return;

  ctx.strokeStyle = currentTheme.grid;
  ctx.lineWidth = 1;

  for (let x = 0; x < canvas.width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawSeries(type) {
  const smooth = document.getElementById("smoothToggle").checked;
  const stepX = canvas.width / (MAX_POINTS - 1);

  series.forEach((s, sIndex) => {
    const data = smooth ? movingAverage(s.data) : s.data;
    ctx.strokeStyle = currentTheme.series[s.colorIndex];
    ctx.fillStyle = currentTheme.series[s.colorIndex];
    ctx.lineWidth = 2;

    /* ----- Line & Area ----- */
    if (type === "line" || type === "area") {
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = i * stepX;
        const y = canvas.height - (v / 100) * canvas.height;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      if (type === "area") {
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    /* ----- Bar ----- */
    if (type === "bar") {
      const barGroupWidth = stepX;
      const barWidth = barGroupWidth / series.length;

      data.forEach((v, i) => {
        const x = i * stepX + sIndex * barWidth;
        const y = canvas.height - (v / 100) * canvas.height;
        const h = canvas.height - y;

        ctx.fillRect(x, y, barWidth - 2, h);
      });
    }

    /* ----- Scatter ----- */
    if (type === "scatter") {
      data.forEach((v, i) => {
        const x = i * stepX;
        const y = canvas.height - (v / 100) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  });
}

/* ---------------- Stats ---------------- */
function updateStats() {
  const all = series.flatMap(s => s.data);
  if (!all.length) return;

  const current = all.at(-1).toFixed(2);
  const min = Math.min(...all).toFixed(2);
  const max = Math.max(...all).toFixed(2);
  const avg = (all.reduce((a, b) => a + b, 0) / all.length).toFixed(2);
  const trend = all.at(-1) > all[0] ? "Rising ↑" : "Falling ↓";

  document.getElementById("stats").innerHTML = `
    <b>Statistics</b><br>
    Current: ${current}<br>
    Min: ${min}<br>
    Max: ${max}<br>
    Avg: ${avg}<br>
    Trend: ${trend}
  `;
}

/* ---------------- Main draw ---------------- */
function draw() {
  ctx.fillStyle = currentTheme.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawSeries(document.getElementById("chartType").value);
  updateStats();
}

/* ---------------- Tooltip ---------------- */
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  const index = Math.round(
    (e.clientX - rect.left) / (canvas.width / (MAX_POINTS - 1))
  );

  if (series[0].data[index] !== undefined) {
    tooltip.style.display = "block";
    tooltip.style.left = e.pageX + 10 + "px";
    tooltip.style.top = e.pageY + 10 + "px";
    tooltip.innerHTML = series
      .map((s, i) => `Series ${i + 1}: ${s.data[index].toFixed(2)}`)
      .join("<br>");
  }
});

canvas.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});

/* ---------------- Controls ---------------- */
document.getElementById("toggleRun").onclick = () => {
  running = !running;
  document.getElementById("toggleRun").textContent = running ? "Pause" : "Start";
};

document.getElementById("speed").oninput = e => interval = +e.target.value;

document.getElementById("reset").onclick = () => {
  series.forEach(s => (s.data = []));
};

document.getElementById("export").onclick = () => {
  const link = document.createElement("a");
  link.download = "chart.png";
  link.href = canvas.toDataURL();
  link.click();
};

document.getElementById("theme").onchange = e => {
  currentTheme = themes[e.target.value];
};

/* ---------------- Loop ---------------- */
setInterval(() => {
  if (running) updateData();
  draw();
}, interval);
