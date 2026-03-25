const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configurações Iniciais
canvas.width = 600;
canvas.height = 500;

let currentUser = "";
let score = 0;
let level = 1;
let gameActive = false;
let enemies = [];
let bullets = [];
const keys = {};

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 70,
    w: 44,
    h: 44,
    speed: 8,
    color: '#00f2ff'
};

// --- CONTROLES ---
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameActive) shoot();
});
window.addEventListener('keyup', e => keys[e.code] = false);

// --- FUNÇÕES DE INÍCIO E LOGIN ---
function startGame() {
    const input = document.getElementById('username');
    if (input.value.trim().length < 2) {
        alert("Digite um Nickname válido!");
        return;
    }
    currentUser = input.value.trim();
    document.getElementById('display-name').innerText = currentUser;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    
    resetStats();
    gameActive = true;
    spawnEnemy();
    gameLoop();
}

function resetStats() {
    score = 0;
    level = 1;
    enemies = [];
    bullets = [];
    player.x = canvas.width / 2 - 20;
    document.getElementById('score').innerText = "0";
    document.getElementById('level').innerText = "1";
}

// --- MECÂNICAS DO JOGO ---
function shoot() {
    bullets.push({ x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 18, speed: 10 });
}

function spawnEnemy() {
    if (!gameActive) return;
    
    const size = 35;
    enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        w: size,
        h: size,
        speedY: 1.5 + (level * 0.4),
        speedX: (Math.random() - 0.5) * 4,
        phase: Math.random() * 5
    });

    // Spawn mais rápido conforme o nível
    const nextSpawn = Math.max(350, 1500 - (level * 150));
    setTimeout(spawnEnemy, nextSpawn);
}

function update() {
    // Movimento do Jogador
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;

    // Movimento das Balas
    bullets.forEach((b, index) => {
        b.y -= b.speed;
        if (b.y < 0) bullets.splice(index, 1);
    });

    // Movimento dos Inimigos e Colisões
    enemies.forEach((en, eIdx) => {
        en.y += en.speedY;
        en.x += Math.sin(en.y * 0.04 + en.phase) * 3 + en.speedX;

        // Rebate nas paredes
        if (en.x <= 0 || en.x >= canvas.width - en.w) en.speedX *= -1;

        // COLISÃO: Inimigo toca no Jogador (MORTE)
        if (rectIntersect(player.x, player.y, player.w, player.h, en.x, en.y, en.w, en.h)) {
            gameOver();
        }

        // Remover se sair da tela
        if (en.y > canvas.height) enemies.splice(eIdx, 1);

        // COLISÃO: Bala toca no Inimigo
        bullets.forEach((bullet, bIdx) => {
            if (rectIntersect(bullet.x, bullet.y, bullet.w, bullet.h, en.x, en.y, en.w, en.h)) {
                enemies.splice(eIdx, 1);
                bullets.splice(bIdx, 1);
                score += 10;
                updateDifficulty();
            }
        });
    });
}

function updateDifficulty() {
    let nextLevel = Math.floor(score / 100) + 1;
    if (nextLevel > level) level = nextLevel;
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

// --- RENDERIZAÇÃO (DESENHOS) ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Jogador (Nave Triangular)
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.w/2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    
    // Propulsor
    ctx.fillStyle = Math.random() > 0.5 ? '#ffaa00' : '#ff4400';
    ctx.fillRect(player.x + player.w/2 - 4, player.y + player.h, 8, 8);

    // Inimigos (Naves Inimigas)
    enemies.forEach(en => {
        ctx.shadowColor = '#ff0055';
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(en.x + en.w/2, en.y + en.h/2, en.w/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.fillRect(en.x + 5, en.y + en.h/2 - 2, en.w - 10, 4); // Detalhe da nave
    });

    // Balas
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'yellow';
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    ctx.shadowBlur = 0;
}

function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- SISTEMA DE RANKING E FIM ---
function gameOver() {
    gameActive = false;
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
    document.getElementById('player-finish').innerText = currentUser;
    saveRanking(currentUser, score);
    showRanking();
}

function saveRanking(name, pts) {
    let rank = JSON.parse(localStorage.getItem('stellarRank') || '[]');
    rank.push({ name, pts });
    rank.sort((a, b) => b.pts - a.pts);
    localStorage.setItem('stellarRank', JSON.stringify(rank.slice(0, 5)));
}

function showRanking() {
    const list = document.getElementById('rank-list');
    const rank = JSON.parse(localStorage.getItem('stellarRank') || '[]');
    list.innerHTML = rank.map(i => `<li>${i.name}: <b>${i.pts} pts</b></li>`).join('');
}

function restartGame() {
    document.getElementById('overlay').classList.add('hidden');
    resetStats();
    gameActive = true;
    spawnEnemy();
    gameLoop();
}
