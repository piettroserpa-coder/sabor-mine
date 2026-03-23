const container = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const highScoreEl = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over');

let score = 0;
let level = 1;
let playerX = 230;
let isGameOver = false;
let enemySpeed = 2;
let spawnRate = 1500;
let enemyInterval;

// Carregar recorde do Ranking Local
let highScore = localStorage.getItem('highScore') || 0;
highScoreEl.innerText = highScore;

// Movimento do Jogador
document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    if (e.key === 'ArrowLeft' && playerX > 0) playerX -= 25;
    if (e.key === 'ArrowRight' && playerX < 460) playerX += 25;
    if (e.key === ' ') shoot();
    player.style.left = playerX + 'px';
});

function shoot() {
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = (playerX + 18) + 'px';
    bullet.style.bottom = '60px';
    container.appendChild(bullet);

    let bulletMove = setInterval(() => {
        let bBot = parseInt(bullet.style.bottom);
        bullet.style.bottom = (bBot + 7) + 'px';

        const enemies = document.querySelectorAll('.enemy');
        enemies.forEach(en => {
            if (checkCollision(bullet, en)) {
                en.remove();
                bullet.remove();
                clearInterval(bulletMove);
                updateScore();
            }
        });

        if (bBot > 600) {
            clearInterval(bulletMove);
            bullet.remove();
        }
    }, 10);
}

function createEnemy() {
    if (isGameOver) return;
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    enemy.style.left = Math.floor(Math.random() * 460) + 'px';
    enemy.style.top = '0px';
    container.appendChild(enemy);

    let enemyMove = setInterval(() => {
        if (isGameOver) {
            clearInterval(enemyMove);
            enemy.remove();
            return;
        }

        let eTop = parseInt(enemy.style.top);
        enemy.style.top = (eTop + enemySpeed) + 'px';

        // Colisão: Azul encosta no Vermelho (MORRE)
        if (checkCollision(player, enemy)) {
            endGame();
        }

        if (eTop > 600) {
            clearInterval(enemyMove);
            enemy.remove();
        }
    }, 20);
}

function updateScore() {
    score += 10;
    scoreEl.innerText = score;

    // Lógica de Novas Fases (A cada 100 pontos)
    if (score % 100 === 0) {
        level++;
        levelEl.innerText = level;
        enemySpeed += 0.5; // Fica mais rápido
        spawnRate = Math.max(500, spawnRate - 100); // Aparece mais rápido
        clearInterval(enemyInterval);
        enemyInterval = setInterval(createEnemy, spawnRate);
    }
}

function checkCollision(a, b) {
    let aRect = a.getBoundingClientRect();
    let bRect = b.getBoundingClientRect();
    return !(a
