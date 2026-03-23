const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 500;

// Estado do Jogo
let score = 0;
let level = 1;
let gameActive = true;
let enemies = [];
let bullets = [];
const keys = {};

// Configurações do Jogador
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    w: 40,
    h: 40,
    speed: 7,
    color: '#00aaff'
};

// Eventos de Teclado
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Função para disparar
function shoot() {
    bullets.push({ x: player.x + player.w/2 - 2.5, y: player.y, w: 5, h: 15, speed: 8 });
}

window.addEventListener('keydown', e => {
    if (e.code === 'Space' && gameActive) shoot();
});

function spawnEnemy() {
    if (!gameActive) return;
    const size = 30 + Math.random() * 20;
    enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        w: size,
        h: size,
        speed: 1 + (level * 0.5) // Aumenta velocidade conforme o nível
    });
    // Agendar próximo spawn baseado no nível
    setTimeout(spawnEnemy, Math.max(300, 1500 - (level * 100)));
}

function update() {
    if (!gameActive) return;

    // Movimento Jogador
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;

    // Movimento Balas
    bullets.forEach((b, i) => {
        b.y -= b.speed;
        if (b.y < 0) bullets.splice(i, 1);
    });

    // Movimento Inimigos
    enemies.forEach((en, i) => {
        en.y += en.speed;

        // Colisão Inimigo com Jogador (MORTE)
        if (rectIntersect(player.x, player.y, player.w, player.h, en.x, en.y, en.w, en.h)) {
            gameOver();
        }

        if (en.y > canvas.height) enemies.splice(i, 1);

        // Colisão Bala com Inimigo
        bullets.forEach((b, bi) => {
            if (rectIntersect(b.x, b.y, b.w, b.h, en.x, en.y, en.w, en.h)) {
                enemies.splice(i, 1);
                bullets.splice(bi, 1);
                score += 10;
                checkLevel();
            }
        });
    });
}

function checkLevel() {
    let nextLevel = Math.floor(score / 100) + 1;
    if (nextLevel > level) {
        level = nextLevel;
        document.getElementById('level').innerText = level;
    }
    document.getElementById('score').innerText = score;
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar Jogador (com brilho)
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Desenhar Balas
    ctx.shadowColor = 'yellow';
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    // Desenhar Inimigos
    ctx.shadowColor = 'red';
    ctx.fillStyle = '#ff4444';
    enemies.forEach(en => ctx.fillRect(en.x, en.y, en.w, en.h));
    
    ctx.shadowBlur = 0; // Reset brilho
}

function gameOver() {
    gameActive = false;
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
    saveRanking(score);
    showRanking();
}

function saveRanking(newScore) {
    let ranking = JSON.parse(localStorage.getItem('ranking') || '[]');
    ranking.push(newScore);
    ranking.sort((a, b) => b - a);
    ranking = ranking.slice(0, 3); // Mantém apenas os 3 melhores
    localStorage.setItem('ranking', JSON.stringify(ranking));
}

function showRanking() {
    const list = document.getElementById('rank-list');
    const ranking = JSON.parse(localStorage.getItem('ranking') || '[]');
    list.innerHTML = ranking.map((s, i) => `<li>${i+1}º Lugar: ${s} pts</li>`).join('');
}

function restartGame() {
    score = 0; level = 1; enemies = []; bullets = [];
    gameActive = true;
    player.x = canvas.width / 2 - 20;
    document.getElementById('score').innerText = "0";
    document.getElementById('level').innerText = "1";
    document.getElementById('overlay').classList.add('hidden');
    loop();
}

function loop() {
    if (gameActive) {
        update();
        draw();
        requestAnimationFrame(loop);
    }
}

// Iniciar
spawnEnemy();
loop();
