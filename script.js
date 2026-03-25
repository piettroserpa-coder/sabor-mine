const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 550;

let user = "", score = 0, level = 1, gameActive = false;
let enemies = [], bullets = [], particles = [], powerUps = [];
let boss = null;
let tripleShotTimer = 0;
const keys = {};

const player = { x: 275, y: 480, w: 40, h: 40, speed: 7 };

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if(e.code === 'Space' && gameActive) shoot();
});
window.addEventListener('keyup', e => keys[e.code] = false);

function startGame() {
    user = document.getElementById('username').value || "Recruta";
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
    for(let i=0; i<8; i++) {
        particles.push({
            x, y, 
            vx: (Math.random()-0.5)*6, 
            vy: (Math.random()-0.5)*6, 
            life: 1, 
            color
        });
    }
}

function spawnEnemy() {
    if (!gameActive || boss) return; // Não nasce inimigo comum se o Boss estiver na tela
    enemies.push({
        x: Math.random() * (canvas.width - 40),
        y: -40, w: 40, h: 30,
        hp: 1,
        speedY: 1.5 + (level * 0.3),
        phase: Math.random() * 5
    });
    setTimeout(spawnEnemy, Math.max(300, 1500 - (level * 200)));
}

function checkBoss() {
    if (score > 0 && score % 500 === 0 && !boss) {
        boss = {
            x: 200, y: -100, w: 200, h: 80,
            hp: 20 + (level * 10),
            maxHp: 20 + (level * 10),
            speedX: 3,
            targetY: 80
        };
    }
}

function update() {
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;

    if (tripleShotTimer > 0) tripleShotTimer--;

    // Partículas
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if(p.life <= 0) particles.splice(i, 1);
    });

    // Balas
    bullets.forEach((b, i) => {
        b.x += b.vx; b.y += b.vy;
        if (b.y < 0) bullets.splice(i, 1);
    });

    // Power-ups
    powerUps.forEach((p, i) => {
        p.y += 3;
        if (rectIntersect(player.x, player.y, player.w, player.h, p.x, p.y, 20, 20)) {
            tripleShotTimer = 400; // Aprox 7 segundos
            powerUps.splice(i, 1);
        }
    });

    // Logica do Boss
    if (boss) {
        if (boss.y < boss.targetY) boss.y += 2;
        boss.x += boss.speedX;
        if (boss.x <= 0 || boss.x >= canvas.width - boss.w) boss.speedX *= -1;

        // Colisão Bala -> Boss
        bullets.forEach((b, bi) => {
            if (rectIntersect(b.x, b.y, 5, 10, boss.x, boss.y, boss.w, boss.h)) {
                boss.hp--;
                bullets.splice(bi, 1);
                createParticles(b.x, b.y, 'white');
                if (boss.hp <= 0) {
                    score += 200;
                    createParticles(boss.x + 100, boss.y + 40, 'red');
                    boss = null;
                    level++;
                    spawnEnemy();
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
            if (rectIntersect(b.x, b.y, 5, 10, en.x, en.y, en.w, en.h)) {
                createParticles(en.x + 20, en.y + 15, '#00ff44');
                if (Math.random() > 0.9) powerUps.push({x: en.x, y: en.y});
                enemies.splice(i, 1);
                bullets.splice(bi, 1);
                score += 10;
                checkBoss();
            }
        });
        if (en.y > canvas.height) enemies.splice(i, 1);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = tripleShotTimer > 0 ? 'gold' : '#00f2ff';
    ctx.beginPath();
    ctx.moveTo(player.x + 20, player.y);
    ctx.lineTo(player.x + 40, player.y + 40);
    ctx.lineTo(player.x, player.y + 40);
    ctx.fill();

    // Inimigos
    enemies.forEach(en => {
        ctx.fillStyle = '#00ff44';
        ctx.beginPath(); ctx.ellipse(en.x+20, en.y+15, 20, 10, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(en.x+20, en.y+10, 7, 0, Math.PI, true); ctx.fill();
    });

    // Boss
    if (boss) {
        ctx.fillStyle = `rgb(255, ${255 * (boss.hp/boss.maxHp)}, 0)`;
        ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
        ctx.fillStyle = 'white';
        ctx.fillText("BOSS HP: " + boss.hp, boss.x + 70, boss.y - 10);
    }

    // Power-ups
    powerUps.forEach(p => {
        ctx.fillStyle = 'gold';
        ctx.beginPath(); ctx.arc(p.x+10, p.y+10, 10, 0, Math.PI*2); ctx.fill();
    });

    // Balas e Partículas
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, 4, 12));
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
    list.innerHTML = ranking.map(r => `<li><span>${r.name}</span><b>${r.pts}</b></li>`).join('');
}

function restartGame() {
    location.reload();
}

function loop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(loop);
}
