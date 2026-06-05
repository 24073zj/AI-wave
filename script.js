const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

const width = canvas.width;
const height = canvas.height;

const player = {
  x: 140,
  y: height / 2,
  size: 24,
  velocity: 0,
  gravity: 0.35,
  lift: -0.65,
};

const obstacleWidth = 58;
const gapSize = 170;
const spawnSpacing = 280;

let obstacles = [];
let frame = 0;
let score = 0;
let best = 0;
let started = false;
let alive = true;
let inputActive = false;

function resetGame() {
  obstacles = [];
  frame = 0;
  score = 0;
  player.y = height / 2;
  player.velocity = 0;
  alive = true;
  started = true;
  inputActive = false;
}

function spawnObstacle() {
  const gapY = 90 + Math.random() * (height - 220 - gapSize);
  obstacles.push({ x: width + 20, gapY, scored: false });
}

function update() {
  if (!started) return;
  if (!alive) return;

  frame += 1;

  if (inputActive) {
    player.velocity += player.lift;
  } else {
    player.velocity += player.gravity;
  }

  player.velocity = Math.max(Math.min(player.velocity, 8), -8);
  player.y += player.velocity;

  if (player.y < 0) {
    player.y = 0;
    player.velocity = 0;
  }
  if (player.y + player.size > height) {
    player.y = height - player.size;
    alive = false;
  }

  if (frame % 90 === 0) {
    spawnObstacle();
  }

  obstacles.forEach((obstacle) => {
    obstacle.x -= 3.6;
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

function collidesWithPlayer(obstacle) {
  const playerLeft = player.x;
  const playerRight = player.x + player.size;
  const playerTop = player.y;
  const playerBottom = player.y + player.size;

  const obsLeft = obstacle.x;
  const obsRight = obstacle.x + obstacleWidth;
  const topBottom = obstacle.gapY;
  const bottomTop = obstacle.gapY + gapSize;

  if (playerRight < obsLeft || playerLeft > obsRight) return false;
  if (playerTop > topBottom && playerBottom < bottomTop) return false;
  return true;
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

  ctx.fillStyle = '#0797d9';
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(player.x + 10, player.y + 10, 4, 4);

  obstacles.forEach((obstacle) => {
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(obstacle.x, 0, obstacleWidth, obstacle.gapY);
    ctx.fillRect(obstacle.x, obstacle.gapY + gapSize, obstacleWidth, height - obstacle.gapY - gapSize - 40);
    ctx.fillStyle = '#ed5565';
    ctx.fillRect(obstacle.x + 10, obstacle.gapY - 8, 38, 8);
    ctx.fillRect(obstacle.x + 10, obstacle.gapY + gapSize, 38, 8);
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
