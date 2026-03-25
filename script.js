const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 550;

let user = "", score = 0, level = 1, gameActive = false;
let enemies = [], bullets = [], particles = [], powerUps = [];
let boss = null;
let lastBossScore = 0; // Controla para o boss não nascer várias vezes no mesmo score
let tripleShotTimer = 0;
const keys = {};

const player = { x: 275, y: 480, w: 40, h: 40, speed: 7 };

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if(e.code === 'Space' && gameActive) shoot();
});
window.addEventListener('keyup', e => keys[e.code] = false);

function startGame() {
    user = document.getElementById('username').value || "Piloto";
    document.getElementById('display-name').innerText = user;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    gameActive = true;
    spawnEnemy();
    loop();
}

function shoot() {
    if (tripleShotTimer > 0) {
        bullets.push({ x: player.x + 20, y: player.y, vx: 0, vy: -10 });
        bullets.push({ x: player.x + 5, y: player.y, vx: -2, vy: -9 });
        bullets.push({ x: player.x + 35, y: player.y, vx: 2, vy: -9 });
    } else {
        bullets.push({ x: player.x + 18, y: player.y, vx: 0, vy: -10 });
    }
}

function createParticles(x, y, color) {
    for(let i=0; i<10; i++) {
        particles.push({
            x, y, 
            vx: (Math.random()-0.5)*8, 
            vy: (Math.random()-0.5)*8, 
            life: 1, 
            color
        });
    }
}

function spawnEnemy() {
    if (!gameActive) return;
    if (!boss) { // Só spawna inimigo comum se NÃO houver boss
        enemies.push({
            x: Math.random() * (canvas.width - 40),
            y: -40, w: 40, h: 30,
            hp: 1,
            speedY: 1.5 + (level * 0.3),
            phase: Math.random() * 5
        });
    }
    setTimeout(spawnEnemy, Math.max(400, 1600 - (level * 200)));
}

function update() {
    if (!gameActive) return;

    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;

    if (tripleShotTimer > 0) tripleShotTimer--;

    // Criar Boss a cada 500 pontos
    if (score > 0 && score % 500 === 0 && lastBossScore !== score && !boss) {
        lastBossScore = score;
        boss = {
            x: 200, y: -120, w: 200, h: 80,
            hp: 30 + (level * 10),
            maxHp: 30 + (level * 10),
            speedX: 3,
            targetY: 80
        };
        enemies = []; // Limpa inimigos comuns ao chegar o boss
    }

    // Lógica das Partículas
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.025;
        if(p.life <= 0) particles.splice(i, 1);
    });

    // Lógica das Balas
    bullets.forEach((b, i) => {
        b.x += b.vx; b.y += b.vy;
        if (b.y < -20 || b.x < -20 || b.x > canvas.width + 20) bullets.splice(i, 1);
    });

    // Lógica dos Power-ups
    powerUps.forEach((p, i) => {
        p.y += 3;
        if (rectIntersect(player.x, player.y, player.w, player.h, p.x, p.y, 25, 25)) {
            tripleShotTimer = 500; 
            powerUps.splice(i, 1);
        }
        if (p.y > canvas.height) powerUps.splice(i, 1);
    });

    // Lógica do Boss
    if (boss) {
        if (boss.y < boss.targetY) boss.y += 2;
        boss.x += boss.speedX;
        if (boss.x <= 0 || boss.x >= canvas.width - boss.w) boss.speedX *= -1;

        // Colisão Jogador com Boss
        if (rectIntersect(player.x, player.y, player.w, player.h, boss.x, boss.y, boss.w, boss.h)) gameOver();

        // Colisão Bala com Boss
        bullets.forEach((b, bi) => {
            if (rectIntersect(b.x, b.y, 4, 12, boss.x, boss.y, boss.w, boss.h)) {
                boss.hp--;
                createParticles(b.x, b.y, 'white');
                bullets.splice(bi, 1);
                if (boss.hp <= 0) {
                    for(let j=0; j<30; j++) createParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#ff00ff');
                    score += 200;
                    level++;
                    boss = null;
                }
            }
        });
    }

    // Inimigos Comuns
    enemies.forEach((en, i) => {
        en.y += en.speedY;
        en.x += Math.sin(en.y * 0.05 + en.phase) * 2;

        if (rectIntersect(player.x, player.y, player.w, player.h, en.x, en.y, en.w, en.h)) gameOver();

        bullets.forEach((b, bi) => {
            if (rectIntersect(b.x, b.y, 4, 12, en.x, en.y, en.w, en.h)) {
                createParticles(en.x + 20, en.y + 15, '#00ff44');
                if (Math.random() > 0.9) powerUps.push({x: en.x, y: en.y});
                enemies.splice(i, 1);
                bullets.splice(bi, 1);
                score += 10;
                document.getElementById('score').innerText = score;
                document.getElementById('level').innerText = level;
            }
        });
        if (en.y > canvas.height) enemies.splice(i, 1);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = tripleShotTimer > 0 ? '#ffea00' : '#00f2ff';
    ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(player.x + 20, player.y);
    ctx.lineTo(player.x + 40, player.y + 40);
    ctx.lineTo(player.x, player.y + 40);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inimigos
    enemies.forEach(en => {
        ctx.fillStyle = '#00ff44';
        ctx.beginPath(); ctx.ellipse(en.x+20, en.y+15, 20, 10, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(en.x+20, en.y+10, 7, 0, Math.PI, true); ctx.fill();
    });

    // Boss
    if (boss) {
        let healthPercent = boss.hp / boss.maxHp;
        ctx.fillStyle = `rgb(255, ${255 * healthPercent}, ${255 * healthPercent})`;
        ctx.shadowBlur = 20; ctx.shadowColor = 'red';
        ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
        
        // Olhos do Boss
        ctx.fillStyle = 'black';
        ctx.fillRect(boss.x + 40, boss.y + 20, 30, 15);
        ctx.fillRect(boss.x + 130, boss.y + 20, 30, 15);
        
        // Barra de Vida Boss
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'red';
        ctx.fillRect(boss.x, boss.y - 15, boss.w * healthPercent, 5);
    }

    // Power-ups
    powerUps.forEach(p => {
        ctx.fillStyle = 'gold';
        ctx.shadowBlur = 15; ctx.shadowColor = 'gold';
        ctx.beginPath(); ctx.arc(p.x+12, p.y+12, 10, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Balas
    ctx.fillStyle = 'white';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 12));

    // Partículas
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;
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
    let rank = JSON.parse(localStorage.getItem('alienRank') || '[]');
    rank.push({ name, pts });
    rank.sort((a, b) => b.pts - a.pts);
    localStorage.setItem('alienRank', JSON.stringify(rank.slice(0, 5)));
}

function showRanking() {
    const list = document.getElementById('rank-list');
    const ranking = JSON.parse(localStorage.getItem('alienRank') || '[]');
    list.innerHTML = ranking.map(r => `<li><span>${r.name}</span><b>${r.pts} pts</b></li>`).join('');
}

function restartGame() {
    location.reload(); // Forma mais segura de resetar todos os timers e variáveis
}

function loop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(loop);
}
