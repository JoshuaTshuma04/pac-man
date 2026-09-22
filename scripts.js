const main = document.querySelector('main');
const scoreDisplay = document.querySelector('.score p');
const startDiv = document.querySelector('.startDiv');
const livesContainer = document.querySelector('.lives ul');
const leaderboard = document.querySelector('.leaderboard ol');

let score = 0;
let lives = 3;
let gameStarted = false;
let pointsTotal = 0;
let playerPos = { x: 1, y: 1 };
let enemies = [];
let enemyIntervals = [];
let movementInterval;
let hitTimeout = false;
let direction = null;

let maze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

function placeEnemiesRandomly(count = 3) {
    const freeSpots = [];

    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 0) {
                freeSpots.push({ x, y });
            }
        }
    }

    for (let i = 0; i < count && freeSpots.length > 0; i++) {
        const index = Math.floor(Math.random() * freeSpots.length);
        const spot = freeSpots.splice(index, 1)[0];
        maze[spot.y][spot.x] = 3;
    }
}

function createMaze() {
    main.innerHTML = '';
    enemies = [];
    pointsTotal = 0;

    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            const block = document.createElement('div');
            block.classList.add('block');

            const value = maze[y][x];

            if (value === 1) {
                block.classList.add('wall');
            } else if (value === 2) {
                const player = document.createElement('div');
                player.id = 'player';
                const mouth = document.createElement('div');
                mouth.classList.add('mouth', 'right'); // default direction
                player.appendChild(mouth);
                block.appendChild(player);
                playerPos = { x, y };
            } else if (value === 3) {
                block.classList.add('enemy');
                enemies.push({ x, y, el: block });
            } else {
                block.classList.add('point');
                block.style.height = '1vh';
                block.style.width = '1vh';
                pointsTotal++;
            }

            main.appendChild(block);
        }
    }
}

function getBlock(x, y) {
    return main.children[y * 10 + x];
}

function updateScore() {
    scoreDisplay.textContent = score;
}

function updateLives() {
    livesContainer.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const li = document.createElement('li');
        livesContainer.appendChild(li);
    }
}

function movePlayer() {
    if (!gameStarted || hitTimeout) return;

    let newX = playerPos.x;
    let newY = playerPos.y;

    if (direction === 'up') newY--;
    else if (direction === 'down') newY++;
    else if (direction === 'left') newX--;
    else if (direction === 'right') newX++;

    if (maze[newY][newX] === 1) return;

    const currentBlock = getBlock(playerPos.x, playerPos.y);
    const newBlock = getBlock(newX, newY);
    const player = currentBlock.querySelector('#player');
    const mouth = player.querySelector('.mouth');

    if (direction) mouth.className = `mouth ${direction}`;

    if (newBlock.classList.contains('enemy')) {
        hitEnemy(player);
        return;
    }

    if (newBlock.classList.contains('point')) {
        newBlock.classList.remove('point');
        score += 10;
        updateScore();
        pointsTotal--;
        if (pointsTotal === 0) return gameOver(true);
    }

    newBlock.appendChild(player);
    playerPos = { x: newX, y: newY };
}

function moveEnemies() {
    enemies.forEach((enemy, index) => {
        let dir = Math.floor(Math.random() * 4);

        enemyIntervals[index] = setInterval(() => {
            if (!gameStarted) return;

            const directions = [
                { x: 0, y: -1 },
                { x: 0, y: 1 },
                { x: -1, y: 0 },
                { x: 1, y: 0 }
            ];

            const newX = enemy.x + directions[dir].x;
            const newY = enemy.y + directions[dir].y;

            if (maze[newY][newX] !== 1) {
                const oldBlock = getBlock(enemy.x, enemy.y);
                const newBlock = getBlock(newX, newY);
                oldBlock.classList.remove('enemy');
                newBlock.classList.add('enemy');
                enemy.x = newX;
                enemy.y = newY;

                if (newX === playerPos.x && newY === playerPos.y) {
                    hitEnemy(getBlock(newX, newY).querySelector('#player'));
                }
            } else {
                dir = Math.floor(Math.random() * 4);
            }
        }, 600);
    });
}

function hitEnemy(player) {
    if (hitTimeout) return;
    hitTimeout = true;
    lives--;
    updateLives();
    player.classList.add('hit');

    if (lives <= 0) return gameOver(false);

    setTimeout(() => {
        player.classList.remove('hit');
        hitTimeout = false;
    }, 1500);
}

function gameOver(won) {
    gameStarted = false;
    clearInterval(movementInterval);
    enemyIntervals.forEach(clearInterval);
    const player = document.querySelector('#player');
    if (!won) player.classList.add('dead');
    setTimeout(() => {
        const name = prompt("Game Over! Enter your name:");
        saveScore(name, score);
        renderLeaderboard();
        if (confirm("Restart?")) {
            location.reload();
        }
    }, 1500);
}

function saveScore(name, score) {
    const scores = JSON.parse(localStorage.getItem('leaderboard')) || [];
    scores.push({ name, score });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('leaderboard', JSON.stringify(scores.slice(0, 5)));
}

function renderLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.innerHTML = '';
    scores.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.name}........${entry.score}`;
        leaderboard.appendChild(li);
    });
}

function handleKeyDown(e) {
    if (!gameStarted) return;
    switch (e.key) {
        case 'ArrowUp': direction = 'up'; break;
        case 'ArrowDown': direction = 'down'; break;
        case 'ArrowLeft': direction = 'left'; break;
        case 'ArrowRight': direction = 'right'; break;
    }
}

function setupControls() {
    document.getElementById('ubttn').onclick = () => direction = 'up';
    document.getElementById('dbttn').onclick = () => direction = 'down';
    document.getElementById('lbttn').onclick = () => direction = 'left';
    document.getElementById('rbttn').onclick = () => direction = 'right';
}

function startGame() {
    placeEnemiesRandomly(3); // Place 3 enemies randomly
    createMaze();
    updateScore();
    updateLives();
    renderLeaderboard();
    startDiv.style.display = 'none';
    gameStarted = true;

    movementInterval = setInterval(movePlayer, 150);
    moveEnemies();
}

document.querySelector('.start').addEventListener('click', startGame);
document.addEventListener('keydown', handleKeyDown);
setupControls();
