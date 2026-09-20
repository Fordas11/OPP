const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const startScreen = document.querySelector('#startScreen');
const gameOver = document.querySelector('#gameOver');
const pauseScreen = document.querySelector('#pauseScreen');
const finalLevel = document.querySelector('#finalLevel');
const settingsPanel = document.querySelector('#settingsPanel');
const bindingHint = document.querySelector('#bindingHint');
let W = 960;
const H = 600;
const keys = new Set();
let game, lastTime = 0;

const defaultBindings = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'Mouse0' };
const difficultyModes = {
  calm: { sight: 180, damage: 1 },
  standard: { sight: 250, damage: 1 },
  brutal: { sight: 340, damage: 2 }
};
let savedSettings = {};
try { savedSettings = JSON.parse(localStorage.getItem('bonebound-settings')) || {}; } catch { /* Settings simply use defaults when storage is unavailable. */ }
let bindings = { ...defaultBindings, ...savedSettings.bindings };
let difficulty = difficultyModes[savedSettings.difficulty] ? savedSettings.difficulty : 'standard';
let waitingForBinding = null;
let settingsWasPlaying = false;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const random = (min, max) => min + Math.random() * (max - min);

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const displayWidth = Math.max(1, canvas.clientWidth);
  const displayHeight = Math.max(1, canvas.clientHeight);
  const previousWidth = W;
  // A wider monitor reveals more dungeon instead of stretching the characters.
  W = H * displayWidth / displayHeight;
  canvas.width = Math.round(displayWidth * pixelRatio);
  canvas.height = Math.round(displayHeight * pixelRatio);
  if (game && previousWidth !== W) {
    const horizontalRatio = W / previousWidth;
    [game.player, ...game.enemies, ...game.obstacles].forEach(entity => { entity.x *= horizontalRatio; });
    keepInArena(game.player);
    game.enemies.forEach(keepInArena);
  }
}

function begin() {
  game = { level: 1, player: makePlayer(), enemies: [], obstacles: [], particles: [], flashes: [], state: 'playing', banner: 2.2 };
  spawnFloor();
  startScreen.classList.add('hidden');
  gameOver.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function makePlayer() { return { x: W / 2, y: H / 2, r: 18, kind: 'knight', hp: 6, maxHp: 6, aim: 0, attack: 0, cool: 0, hurt: 0, speed: 245 }; }

function spawnFloor() {
  const count = game.level + 2;
  game.enemies = [];
  game.obstacles = [];
  const obstacleCount = Math.min(6, 2 + Math.floor(game.level / 2));
  for (let i = 0; i < obstacleCount; i++) {
    let x, y, r, attempts = 0;
    do {
      x = random(95, W - 95); y = random(120, H - 85); r = random(22, 34); attempts++;
    } while (attempts < 40 && (!isClearOfObstacles(x, y, r + 28) || Math.hypot(x - W / 2, y - H / 2) < 155));
    game.obstacles.push({ x, y, r, kind: Math.random() < .5 ? 'pillar' : 'boulder' });
  }
  for (let i = 0; i < count; i++) {
    let x, y, attempts = 0;
    do { x = random(75, W - 75); y = random(105, H - 75); attempts++; } while (attempts < 50 && (Math.hypot(x - W / 2, y - H / 2) < 190 || !isClearOfObstacles(x, y, 20)));
    game.enemies.push({ x, y, r: 16, kind: 'skeleton', hp: 2 + Math.floor(game.level / 4), maxHp: 2 + Math.floor(game.level / 4), speed: 54 + game.level * 4, hit: 0, attack: random(.2, .9), wobble: Math.random() * 6, wanderAngle: Math.random() * Math.PI * 2, wanderTime: random(.4, 1.7) });
  }
  game.banner = 2.2;
}

function isClearOfObstacles(x, y, radius) { return game.obstacles.every(o => Math.hypot(x - o.x, y - o.y) > radius + o.r); }
function keepInArena(entity) {
  const isKnight = entity.kind === 'knight';
  const horizontalInset = isKnight ? 70 : 48;
  const topInset = isKnight ? 100 : 90;
  const bottomInset = 48;
  entity.x = clamp(entity.x, horizontalInset, W - horizontalInset);
  entity.y = clamp(entity.y, topInset, H - bottomInset);
}
function moveEntity(entity, dx, dy) {
  const isKnight = entity.kind === 'knight';
  const horizontalInset = isKnight ? 70 : 48;
  const topInset = isKnight ? 100 : 90;
  const bottomInset = 48;
  const nextX = clamp(entity.x + dx, horizontalInset, W - horizontalInset);
  if (isClearOfObstacles(nextX, entity.y, entity.r)) entity.x = nextX;
  const nextY = clamp(entity.y + dy, topInset, H - bottomInset);
  if (isClearOfObstacles(entity.x, nextY, entity.r)) entity.y = nextY;
}
function hasLineOfSight(from, to) {
  if (distance(from, to) > difficultyModes[difficulty].sight) return false;
  const dx = to.x - from.x, dy = to.y - from.y, lengthSquared = dx * dx + dy * dy;
  return game.obstacles.every(o => {
    const progress = clamp(((o.x - from.x) * dx + (o.y - from.y) * dy) / lengthSquared, 0, 1);
    return Math.hypot(o.x - (from.x + dx * progress), o.y - (from.y + dy * progress)) > o.r + 5;
  });
}

function update(dt) {
  if (game.state !== 'playing') return;
  const p = game.player;
  game.banner = Math.max(0, game.banner - dt);
  p.attack = Math.max(0, p.attack - dt);
  p.cool = Math.max(0, p.cool - dt);
  p.hurt = Math.max(0, p.hurt - dt);
  let dx = (keys.has(bindings.right) ? 1 : 0) - (keys.has(bindings.left) ? 1 : 0);
  let dy = (keys.has(bindings.down) ? 1 : 0) - (keys.has(bindings.up) ? 1 : 0);
  if (dx || dy) { const l = Math.hypot(dx, dy); moveEntity(p, dx / l * p.speed * dt, dy / l * p.speed * dt); }
  for (const e of game.enemies) {
    e.hit = Math.max(0, e.hit - dt); e.attack -= dt;
    const angle = Math.atan2(p.y - e.y, p.x - e.x), d = distance(p, e);
    if (hasLineOfSight(e, p)) {
      if (d > 38) moveEntity(e, Math.cos(angle) * e.speed * dt, Math.sin(angle) * e.speed * dt);
    } else {
      e.wanderTime -= dt;
      if (e.wanderTime <= 0) { e.wanderAngle = Math.random() * Math.PI * 2; e.wanderTime = random(.55, 1.8); }
      const oldX = e.x, oldY = e.y;
      moveEntity(e, Math.cos(e.wanderAngle) * e.speed * .48 * dt, Math.sin(e.wanderAngle) * e.speed * .48 * dt);
      if (e.x === oldX && e.y === oldY) e.wanderTime = 0;
    }
    if (d < 41 && e.attack <= 0 && p.hurt <= 0) { p.hp -= difficultyModes[difficulty].damage; p.hurt = .58; e.attack = 1.05; game.flashes.push({ life: .14, color: '#e4d8c6' }); burst(p.x, p.y, '#b74843', 10); }
  }
  game.particles.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .93; q.vy *= .93; q.life -= dt; });
  game.particles = game.particles.filter(q => q.life > 0);
  game.flashes.forEach(f => f.life -= dt); game.flashes = game.flashes.filter(f => f.life > 0);
  if (p.hp <= 0) endGame();
  if (!game.enemies.length && game.state === 'playing') { game.level++; spawnFloor(); }
}

function attack() {
  const p = game.player;
  if (p.cool > 0) return;
  p.attack = .18; p.cool = .35;
  const victims = game.enemies.filter(e => {
    const angle = Math.atan2(e.y - p.y, e.x - p.x);
    return distance(p, e) < 83 && Math.cos(angle - p.aim) > -.15;
  });
  for (const e of victims) { e.hp--; e.hit = .16; const angle = Math.atan2(e.y - p.y, e.x - p.x); moveEntity(e, Math.cos(angle) * 20, Math.sin(angle) * 20); burst(e.x, e.y, '#ded6bf', 7); }
  game.enemies = game.enemies.filter(e => { if (e.hp > 0) return true; burst(e.x, e.y, '#d9d0b9', 18); return false; });
}

function burst(x, y, color, amount) { for (let i = 0; i < amount; i++) { const a = Math.random() * Math.PI * 2, v = random(35, 155); game.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: random(.22, .55), size: random(2, 5), color }); } }
function endGame() { game.state = 'over'; finalLevel.textContent = `You reached floor ${game.level}.`; gameOver.classList.remove('hidden'); }

function draw() {
  const scale = canvas.height / H;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const floor = ctx.createLinearGradient(0, 0, W, H); floor.addColorStop(0, '#252235'); floor.addColorStop(1, '#171525'); ctx.fillStyle = floor; ctx.fillRect(0, 0, W, H);
  drawTiles();
  ctx.fillStyle = '#110f1ad0'; ctx.fillRect(0, 0, W, 48); ctx.fillStyle = '#e8dcb9'; ctx.font = '700 18px Cinzel'; ctx.fillText(`FLOOR ${game.level}`, 25, 31); ctx.font = '13px DM Mono'; ctx.fillStyle = '#b8afbd'; ctx.fillText(`${game.enemies.length} SKELETON${game.enemies.length === 1 ? '' : 'S'} REMAIN`, 150, 30);
  drawHealth();
  game.obstacles.forEach(drawObstacle);
  game.enemies.sort((a,b) => a.y - b.y).forEach(drawSkeleton);
  drawKnight(game.player);
  game.particles.forEach(q => { ctx.globalAlpha = Math.min(1, q.life * 3); ctx.fillStyle = q.color; ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); }); ctx.globalAlpha = 1;
  if (game.banner > 0) { ctx.globalAlpha = Math.min(1, game.banner * 2); ctx.textAlign = 'center'; ctx.font = '800 36px Cinzel'; ctx.fillStyle = '#f2d98d'; ctx.fillText(`FLOOR ${game.level}`, W / 2, 92); ctx.font = '13px DM Mono'; ctx.fillStyle = '#d0c6cf'; ctx.fillText(`${game.enemies.length} BONES STIR IN THE DARK`, W / 2, 116); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
  if (game.flashes.length) { ctx.fillStyle = game.flashes[0].color; ctx.globalAlpha = game.flashes[0].life * 2; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

function drawTiles() { ctx.strokeStyle = '#363148'; ctx.lineWidth = 1; for (let x = 0; x < W; x += 64) { for (let y = 48; y < H; y += 64) { ctx.strokeRect(x + .5, y + .5, 64, 64); } } ctx.strokeStyle = '#51465a'; ctx.lineWidth = 13; ctx.strokeRect(8, 54, W - 16, H - 64); ctx.strokeStyle = '#211d2d'; ctx.lineWidth = 5; ctx.strokeRect(8, 54, W - 16, H - 64); }
function drawHealth() { const p = game.player; ctx.fillStyle = '#312939'; ctx.fillRect(W - 179, 19, 145, 12); ctx.fillStyle = '#ad4947'; ctx.fillRect(W - 177, 21, 141 * (p.hp / p.maxHp), 8); ctx.strokeStyle = '#938071'; ctx.strokeRect(W - 179.5, 18.5, 145, 13); ctx.fillStyle = '#eee1c9'; ctx.font = '12px DM Mono'; ctx.fillText('VIGOR', W - 241, 30); }
function drawObstacle(o) {
  ctx.save(); ctx.translate(o.x, o.y);
  ctx.fillStyle = '#0b0911a8'; ctx.beginPath(); ctx.ellipse(0, o.r * .65, o.r * 1.1, o.r * .38, 0, 0, Math.PI * 2); ctx.fill();
  if (o.kind === 'pillar') {
    ctx.fillStyle = '#766a79'; ctx.fillRect(-o.r * .58, -o.r, o.r * 1.16, o.r * 1.7); ctx.strokeStyle = '#302b3b'; ctx.lineWidth = 4; ctx.strokeRect(-o.r * .58, -o.r, o.r * 1.16, o.r * 1.7);
    ctx.fillStyle = '#958898'; ctx.fillRect(-o.r * .73, -o.r * 1.1, o.r * 1.46, o.r * .24); ctx.fillRect(-o.r * .73, o.r * .58, o.r * 1.46, o.r * .23);
    ctx.strokeStyle = '#464052'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-3, -o.r * .82); ctx.lineTo(5, -2); ctx.lineTo(-2, o.r * .46); ctx.stroke();
  } else {
    ctx.fillStyle = '#625b70'; ctx.beginPath(); ctx.moveTo(-o.r, o.r * .5); ctx.lineTo(-o.r * .72, -o.r * .48); ctx.lineTo(-o.r * .14, -o.r); ctx.lineTo(o.r * .72, -o.r * .5); ctx.lineTo(o.r, o.r * .42); ctx.lineTo(o.r * .3, o.r * .78); ctx.lineTo(-o.r * .56, o.r * .72); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#373144'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = '#8a8091'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-o.r * .45, -o.r * .28); ctx.lineTo(o.r * .15, -o.r * .1); ctx.lineTo(o.r * .35, o.r * .4); ctx.stroke();
  }
  ctx.restore();
}
function drawSkeleton(e) { const bounce = Math.sin(performance.now() / 170 + e.wobble) * 2; ctx.save(); ctx.translate(e.x, e.y + bounce); ctx.globalAlpha = e.hit ? .45 : 1; ctx.fillStyle = '#0b0911aa'; ctx.beginPath(); ctx.ellipse(0, 18, 18, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#d8d1bb'; ctx.fillStyle = '#c9c1aa'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -11, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#271f28'; ctx.beginPath(); ctx.arc(-4, -12, 3.5, 0, 7); ctx.arc(5, -12, 3.5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(0,-1); ctx.lineTo(-7,16); ctx.moveTo(0,-1); ctx.lineTo(8,16); ctx.moveTo(-6,7); ctx.lineTo(7,7); ctx.moveTo(-5,2); ctx.lineTo(-14,12); ctx.moveTo(5,2); ctx.lineTo(14,11); ctx.moveTo(-7,16); ctx.lineTo(-10,25); ctx.moveTo(8,16); ctx.lineTo(11,25); ctx.stroke(); ctx.restore(); if (e.hp < e.maxHp) { ctx.fillStyle = '#2b2430'; ctx.fillRect(e.x-15,e.y-34,30,4); ctx.fillStyle = '#b94c49'; ctx.fillRect(e.x-15,e.y-34,30*e.hp/e.maxHp,4); } }
function drawKnight(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = p.hurt && Math.floor(p.hurt * 15) % 2 ? .35 : 1;
  ctx.fillStyle = '#0a0911aa'; ctx.beginPath(); ctx.ellipse(0, 20, 20, 7, 0, 0, Math.PI * 2); ctx.fill();

  // The body is never rotated: only its cape swaps sides as the aim crosses the knight.
  const capeSide = Math.cos(p.aim) >= 0 ? -1 : 1;
  ctx.fillStyle = '#9f3e43'; ctx.beginPath(); ctx.moveTo(capeSide * 10, -10); ctx.lineTo(capeSide * 31, 4); ctx.lineTo(capeSide * 16, 13); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c5cbd4'; ctx.beginPath(); ctx.arc(0, -8, 13, Math.PI, 0); ctx.lineTo(13, 11); ctx.lineTo(-13, 11); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#454b58'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#d5d8d5'; ctx.fillRect(-9, 5, 18, 17); ctx.strokeRect(-9, 5, 18, 17);
  const faceSide = Math.cos(p.aim) >= 0 ? 1 : -1;
  ctx.fillStyle = '#24303c'; ctx.fillRect(faceSide * 3, -11, 3, 4); ctx.fillRect(faceSide * 8, -11, 3, 4);

  // Only the sword pivots towards the mouse pointer; its visual and hit arc share p.aim.
  ctx.save(); ctx.translate(3, 4); ctx.rotate(p.aim);
  const swordLength = p.attack > 0 ? 58 : 38;
  ctx.strokeStyle = '#e5d6a2'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(swordLength, 0); ctx.stroke();
  ctx.strokeStyle = '#6b422b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(9, -7); ctx.lineTo(9, 7); ctx.stroke();
  ctx.restore(); ctx.restore();
}
function loop(time) { const dt = Math.min(.035, (time - lastTime) / 1000); lastTime = time; update(dt); draw(); if (game.state === 'playing') requestAnimationFrame(loop); }

function displayBinding(binding) {
  const labels = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Space: 'Space', Mouse0: 'Left click', Mouse1: 'Middle click', Mouse2: 'Right click' };
  return labels[binding] || binding.replace('Key', '').replace('Digit', '');
}
function saveSettings() { try { localStorage.setItem('bonebound-settings', JSON.stringify({ bindings, difficulty })); } catch { /* The current-session settings still work. */ } }
function renderSettings() {
  document.querySelectorAll('.binding-button').forEach(button => {
    const action = button.dataset.bind;
    button.textContent = waitingForBinding === action ? 'Press a key…' : displayBinding(bindings[action]);
    button.classList.toggle('listening', waitingForBinding === action);
  });
  document.querySelectorAll('#difficultyOptions button').forEach(button => button.classList.toggle('active', button.dataset.difficulty === difficulty));
}
function finishBinding(binding) {
  bindings[waitingForBinding] = binding;
  bindingHint.textContent = `${displayBinding(binding)} is now bound to ${waitingForBinding}.`;
  waitingForBinding = null;
  saveSettings(); renderSettings();
}
function openSettings() {
  settingsWasPlaying = game && game.state === 'playing';
  if (settingsWasPlaying) pauseGame();
  waitingForBinding = null; bindingHint.textContent = 'Select a binding, then press a key. Attack can also use a mouse button.';
  renderSettings(); settingsPanel.classList.remove('hidden');
}
function closeSettings() {
  settingsPanel.classList.add('hidden'); waitingForBinding = null;
  if (settingsWasPlaying && game && game.state === 'paused') resumeGame();
  settingsWasPlaying = false;
}
function pauseGame() {
  if (!game || game.state !== 'playing') return;
  game.state = 'paused'; keys.clear(); pauseScreen.classList.remove('hidden');
}
function resumeGame() {
  if (!game || game.state !== 'paused') return;
  game.state = 'playing'; pauseScreen.classList.add('hidden'); lastTime = performance.now(); requestAnimationFrame(loop);
}
function returnToMainMenu() {
  if (game) game.state = 'menu';
  keys.clear(); pauseScreen.classList.add('hidden'); settingsPanel.classList.add('hidden'); startScreen.classList.remove('hidden'); gameOver.classList.add('hidden');
}
function mouseBinding(event) { return `Mouse${event.button}`; }

window.addEventListener('keydown', event => {
  if (waitingForBinding) {
    event.preventDefault();
    if (event.code === 'Escape') { waitingForBinding = null; bindingHint.textContent = 'Binding change cancelled.'; renderSettings(); }
    else finishBinding(event.code);
    return;
  }
  if (event.code === 'Escape') {
    event.preventDefault();
    if (!settingsPanel.classList.contains('hidden')) closeSettings();
    else if (game && game.state === 'playing') pauseGame();
    else if (game && game.state === 'paused') resumeGame();
    return;
  }
  if (!game || game.state !== 'playing') return;
  if (Object.values(bindings).includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.code === bindings.attack && game && game.state === 'playing') attack();
});
window.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('mousedown', event => {
  if (!waitingForBinding) return;
  if (waitingForBinding !== 'attack') { bindingHint.textContent = 'Movement bindings use keyboard keys.'; return; }
  event.preventDefault(); event.stopPropagation(); finishBinding(mouseBinding(event));
}, true);
canvas.addEventListener('mousemove', event => {
  if (!game) return;
  const bounds = canvas.getBoundingClientRect();
  const mouseX = (event.clientX - bounds.left) * W / bounds.width;
  const mouseY = (event.clientY - bounds.top) * H / bounds.height;
  game.player.aim = Math.atan2(mouseY - game.player.y, mouseX - game.player.x);
});
canvas.addEventListener('mousedown', event => {
  if (mouseBinding(event) !== bindings.attack || !game || game.state !== 'playing') return;
  event.preventDefault();
  attack();
});
canvas.addEventListener('contextmenu', event => event.preventDefault());
document.querySelector('#startButton').addEventListener('click', begin);
document.querySelector('#retryButton').addEventListener('click', begin);
document.querySelector('#menuSettingsButton').addEventListener('click', openSettings);
document.querySelector('#pauseSettingsButton').addEventListener('click', openSettings);
document.querySelector('#restartButton').addEventListener('click', begin);
document.querySelector('#pauseMainMenuButton').addEventListener('click', returnToMainMenu);
document.querySelector('#closeSettings').addEventListener('click', closeSettings);
document.querySelectorAll('.binding-button').forEach(button => button.addEventListener('click', () => {
  waitingForBinding = button.dataset.bind; bindingHint.textContent = waitingForBinding === 'attack' ? 'Press a key or mouse button for attack. Escape cancels.' : `Press a key for ${waitingForBinding}. Escape cancels.`; renderSettings();
}));
document.querySelectorAll('#difficultyOptions button').forEach(button => button.addEventListener('click', () => {
  difficulty = button.dataset.difficulty; saveSettings(); renderSettings();
}));
settingsPanel.addEventListener('mousedown', event => { if (event.target === settingsPanel) closeSettings(); });
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
