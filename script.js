const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 500;

let user = "";
let score = 0;
let level = 1;
let gameActive = false;
let enemies = [];
let bullets = [];
const keys = {};

const player = { x: 275, y: 440, w: 50, h: 40, speed: 8 };

// Eventos
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if(e.code === 'Space' && gameActive) shoot();
});
window.addEventListener('keyup', e => keys[e.code] = false);

function startGame() {
    const input = document.getElementById('username');
    if (!input.value.trim()) return alert("Digite seu nome!");
    user = input.value;
    document.getElementById('display-name').innerText = user;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    gameActive = true;
    spawnEnemy();
    loop();
}

function shoot() {
    bullets.push({ x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 15 });
}

function spawnEnemy() {
    if (!gameActive) return;
    enemies.push({
        x: Math.random() * (canvas.width - 40),
        y: -40,
        w: 40,
        h: 30,
        speedY: 1.5 + (level * 0.3),
        phase: Math.random() * Math.PI * 2 // Para movimento lateral
    });
    setTimeout(spawnEnemy, Math.max(400, 1500 - (level * 150)));
}

function update() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;

    bullets.forEach((b, i) => {
        b.y -= 10;
        if (b.y < 0) bullets.splice(i, 1);
    });

    enemies.forEach((en, i) => {
        en.y += en.speedY;
        en.x += Math.sin(en.y * 0.05 + en.phase) * 2; // Zigue-zague

        // Colisão com Jogador
        if (rectIntersect(player.x, player.y, player.w, player.h, en.x, en.y, en.w, en.h)) {
            gameOver();
        }

        bullets.forEach((b, bi) => {
            if (rectIntersect(b.x, b.y, b.w, b.h, en.x, en.y, en.w, en.h)) {
                enemies.splice(i, 1);
                bullets.splice(bi, 1);
                score += 10;
                if (score % 100 === 0) level++;
                document.getElementById('score').innerText = score;
                document.getElementById('level').innerText = level;
            }
        });

        if (en.y > canvas.height) enemies.splice(i, 1);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Jogador (Nave Azul)
    ctx.fillStyle = '#00f2ff';
    ctx.beginPath();
    ctx.moveTo(player.x + 25, player.y);
    ctx.lineTo(player.x + 50, player.y + 40);
    ctx.lineTo(player.x, player.y + 40);
    ctx.fill();

    // Aliens (Inimigos)
    enemies.forEach(en => {
        ctx.fillStyle = '#00ff44'; // Verde Alien
        ctx.beginPath();
        ctx.ellipse(en.x + 20, en.y + 15, 20, 10, 0, 0, Math.PI * 2); // Corpo
        ctx.fill();
        ctx.fillStyle = '#fff'; // Cabine
        ctx.beginPath();
        ctx.arc(en.x + 20, en.y + 10, 8, 0, Math.PI, true);
        ctx.fill();
    });

    // Tiros
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

function gameOver() {
    gameActive = false;
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
    saveRanking(user, score);
    showRanking();
}

function saveRanking(name, pts) {
    let ranking = JSON.parse(localStorage.getItem('alienRank') || '[]');
    ranking.push({ name, pts });
    ranking.sort((a, b) => b.pts - a.pts);
    localStorage.setItem('alienRank', JSON.stringify(ranking.slice(0, 5)));
}

function showRanking() {
    const list = document.getElementById('rank-list');
    const ranking = JSON.parse(localStorage.getItem('alienRank') || '[]');
    list.innerHTML = ranking.map(r => `<li><span>${r.name}</span><b>${r.pts}</b></li>`).join('');
}

function restartGame() {
    score = 0; level = 1; enemies = []; bullets = [];
    player.x = 275;
    document.getElementById('score').innerText = "0";
    document.getElementById('level').innerText = "1";
    document.getElementById('overlay').classList.add('hidden');
    gameActive = true;
    spawnEnemy();
    loop();
}

function loop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(loop);
}
