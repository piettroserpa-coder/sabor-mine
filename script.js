const container = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score');

let score = 0;
let playerX = 280;

// Movimentação do Jogador
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && playerX > 0) {
        playerX -= 20;
    } else if (e.key === 'ArrowRight' && playerX < 560) {
        playerX += 20;
    } else if (e.key === ' ') {
        shoot();
    }
    player.style.left = playerX + 'px';
});

// Função para Atirar
function shoot() {
    const bullet = document.createElement('div');
    bullet.classList.add('bullet');
    bullet.style.left = (playerX + 17) + 'px';
    bullet.style.bottom = '50px';
    container.appendChild(bullet);

    let moveBullet = setInterval(() => {
        let bulletBottom = parseInt(bullet.style.bottom);
        bullet.style.bottom = (bulletBottom + 5) + 'px';

        // Remover bala se sair da tela
        if (bulletBottom > 400) {
            clearInterval(moveBullet);
            bullet.remove();
        }

        // Checar colisão com inimigos
        const enemies = document.querySelectorAll('.enemy');
        enemies.forEach(enemy => {
            if (checkCollision(bullet, enemy)) {
                enemy.remove();
                bullet.remove();
                clearInterval(moveBullet);
                score += 10;
                scoreElement.innerText = `Pontos: ${score}`;
            }
        });
    }, 10);
}

// Criar Inimigos aleatoriamente
function createEnemy() {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    enemy.style.left = Math.floor(Math.random() * 560) + 'px';
    enemy.style.top = '0px';
    container.appendChild(enemy);

    let moveEnemy = setInterval(() => {
        let enemyTop = parseInt(enemy.style.top);
        enemy.style.top = (enemyTop + 2) + 'px';

        if (enemyTop > 400) {
            clearInterval(moveEnemy);
            enemy.remove();
            // Aqui você poderia adicionar uma lógica de Game Over
        }
    }, 20);
}

// Loop de criação de inimigos
setInterval(createEnemy, 1500);

// Função de Detecção de Colisão
function checkCollision(obj1, obj2) {
    const rect1 = obj1.getBoundingClientRect();
    const rect2 = obj2.getBoundingClientRect();

    return !(
        rect1.top > rect2.bottom ||
        rect1.bottom < rect2.top ||
        rect1.right < rect2.left ||
        rect1.left > rect2.right
    );
}
