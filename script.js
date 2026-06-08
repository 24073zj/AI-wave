const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

const width = canvas.width;
const height = canvas.height;

const levelSpeed = 7.2;
const player = {
  x: 140,
  y: height / 2,
  size: 24,
  speed: levelSpeed,
};

const obstacleWidth = 72;
const gapSize = 150;
const spawnSpacing = 240;

let obstacles = [];
let frame = 0;
let score = 0;
let best = 0;
let started = false;
let alive = true;
let inputActive = false;
let trail = [];

function resetGame() {
  obstacles = [];
  frame = 0;
  score = 0;
  player.y = height / 2;
  alive = true;
  started = true;
  inputActive = false;
  trail = [];
}

function spawnObstacle() {
  const gapY = 90 + Math.random() * (height - 220 - gapSize);
  obstacles.push({ x: width + 20, gapY, scored: false });
}

function update() {
  if (!started) return;
  if (!alive) return;

  frame += 1;

  player.y += inputActive ? -player.speed : player.speed;

  if (player.y < 0) {
    player.y = 0;
  }
  if (player.y + player.size > height) {
    player.y = height - player.size;
    alive = false;
  }

  trail.push({ x: player.x + player.size / 2, y: player.y + player.size / 2 });
  if (trail.length > 30) {
    trail.shift();
  }

  if (frame % 70 === 0) {
    spawnObstacle();
  }

  obstacles.forEach((obstacle) => {
    obstacle.x -= levelSpeed;
    const passed = obstacle.x + obstacleWidth < player.x && !obstacle.scored;
    if (passed) {
      obstacle.scored = true;
      score += 1;
      scoreEl.textContent = score;
      if (score > best) {
        best = score;
        bestEl.textContent = best;
      }
    }
  });

  obstacles = obstacles.filter((obstacle) => obstacle.x + obstacleWidth > -40);

  obstacles.forEach((obstacle) => {
    if (collidesWithPlayer(obstacle)) {
      alive = false;
    }
  });

  if (!alive) {
    started = false;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
    }
  }
}

function sign(px, py, ax, ay, bx, by) {
  return (px - bx) * (ay - by) - (ax - bx) * (py - by);
}

function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = sign(x3, y3, x1, y1, x2, y2);
  const d2 = sign(x4, y4, x1, y1, x2, y2);
  const d3 = sign(x1, y1, x3, y3, x4, y4);
  const d4 = sign(x2, y2, x3, y3, x4, y4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

function rectPolygonCollision(rect, polygon) {
  const rectPoints = [
    { x: rect.left, y: rect.top },
    { x: rect.right, y: rect.top },
    { x: rect.right, y: rect.bottom },
    { x: rect.left, y: rect.bottom },
  ];

  for (const point of rectPoints) {
    if (pointInPolygon(point.x, point.y, polygon)) {
      return true;
    }
  }

  for (const polyPoint of polygon) {
    if (polyPoint.x >= rect.left && polyPoint.x <= rect.right && polyPoint.y >= rect.top && polyPoint.y <= rect.bottom) {
      return true;
    }
  }

  const rectEdges = [
    [rectPoints[0], rectPoints[1]],
    [rectPoints[1], rectPoints[2]],
    [rectPoints[2], rectPoints[3]],
    [rectPoints[3], rectPoints[0]],
  ];
  const polyEdges = [];
  for (let i = 0; i < polygon.length; i++) {
    const nextIndex = (i + 1) % polygon.length;
    polyEdges.push([polygon[i], polygon[nextIndex]]);
  }

  for (const [r1, r2] of rectEdges) {
    for (const [p1, p2] of polyEdges) {
      if (lineSegmentsIntersect(r1.x, r1.y, r2.x, r2.y, p1.x, p1.y, p2.x, p2.y)) {
        return true;
      }
    }
  }

  return false;
}

function collidesWithPlayer(obstacle) {
  const rect = {
    left: player.x,
    right: player.x + player.size,
    top: player.y,
    bottom: player.y + player.size,
  };

  const topLeftY = Math.max(0, obstacle.gapY - obstacleWidth);
  const bottomLeftY = Math.min(height, obstacle.gapY + gapSize + obstacleWidth);

  const topPolygon = [
    { x: obstacle.x, y: 0 },
    { x: obstacle.x + obstacleWidth, y: 0 },
    { x: obstacle.x + obstacleWidth, y: obstacle.gapY },
    { x: obstacle.x, y: topLeftY },
  ];

  const bottomPolygon = [
    { x: obstacle.x, y: height },
    { x: obstacle.x + obstacleWidth, y: height },
    { x: obstacle.x + obstacleWidth, y: obstacle.gapY + gapSize },
    { x: obstacle.x, y: bottomLeftY },
  ];

  return rectPolygonCollision(rect, topPolygon) || rectPolygonCollision(rect, bottomPolygon);
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(79, 209, 255, 0.17)');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#112936';
  ctx.fillRect(0, height - 40, width, 40);

  ctx.fillStyle = '#194055';
  for (let i = 0; i < 30; i++) {
    ctx.fillRect((i * 80 + frame * 0.6) % width, height - 16, 35, 8);
  }

  if (trail.length) {
    const trailOffset = frame * 0.6;
    ctx.strokeStyle = 'rgba(15, 167, 255, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    trail.forEach((point, index) => {
      const x = point.x - trailOffset;
      if (index === 0) {
        ctx.moveTo(x, point.y);
      } else {
        ctx.lineTo(x, point.y);
      }
    });
    ctx.stroke();
  }

  ctx.fillStyle = '#0797d9';
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(player.x + 10, player.y + 10, 4, 4);

  obstacles.forEach((obstacle) => {
    const rightX = obstacle.x + obstacleWidth;
    const topLeftY = Math.max(0, obstacle.gapY - obstacleWidth);
    const bottomLeftY = Math.min(height, obstacle.gapY + gapSize + obstacleWidth);

    const pathPolygon = [
      { x: obstacle.x, y: topLeftY },
      { x: rightX, y: obstacle.gapY },
      { x: rightX, y: obstacle.gapY + gapSize },
      { x: obstacle.x, y: bottomLeftY },
    ];

    ctx.fillStyle = 'rgba(8, 24, 40, 0.9)';
    ctx.beginPath();
    pathPolygon.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(obstacle.x, 0);
    ctx.lineTo(rightX, 0);
    ctx.lineTo(rightX, obstacle.gapY);
    ctx.lineTo(obstacle.x, topLeftY);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(obstacle.x, height);
    ctx.lineTo(rightX, height);
    ctx.lineTo(rightX, obstacle.gapY + gapSize);
    ctx.lineTo(obstacle.x, bottomLeftY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(obstacle.x, topLeftY);
    ctx.lineTo(rightX, obstacle.gapY);
    ctx.lineTo(rightX, obstacle.gapY + gapSize);
    ctx.lineTo(obstacle.x, bottomLeftY);
    ctx.stroke();
  });

  if (!started) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#d6ecff';
    ctx.font = '28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(alive ? 'Tap or Hold to Start' : 'Game Over - Tap to Restart', width / 2, height / 2 - 24);
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('Hold to go up, release to go down', width / 2, height / 2 + 18);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function startInput() {
  inputActive = true;
  if (!started) resetGame();
}

function stopInput() {
  inputActive = false;
}

canvas.addEventListener('mousedown', (event) => {
  event.preventDefault();
  startInput();
});

window.addEventListener('mouseup', () => {
  stopInput();
});

canvas.addEventListener('touchstart', (event) => {
  event.preventDefault();
  startInput();
}, { passive: false });

window.addEventListener('touchend', () => {
  stopInput();
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    startInput();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    stopInput();
  }
});

bestEl.textContent = best;
loop();
