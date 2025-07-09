const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('finalScore');
const livesDisplay = document.getElementById('lives'); // 残機表示要素を追加

// タッチコントロールボタン
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');
const fireButton = document.getElementById('fireButton');

let gameRunning = false;
let score = 0;
let lives = 5; // 残機を初期化
let animationFrameId;

// ゲーム設定
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ENEMY_SPEED = 1; 
const ENEMY_SPAWN_INTERVAL = 1000; // ms
const MAX_ENEMIES = 10;

// プレイヤー
const player = {
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    color: 'cyan',
    dx: 0 // 移動方向
};

// 弾丸
const bullets = [];

// 敵
const enemies = [];

// キー入力状態
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

// タッチ入力状態
const touch = {
    left: false,
    right: false,
    fire: false
};

// Canvasサイズをウィンドウに合わせて調整
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.8; // 幅をウィンドウの80%に設定
    canvas.height = window.innerHeight * 0.7; // 高さをウィンドウの70%に設定
    // プレイヤーの初期位置を再設定
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 10;
}

// 初期化
function initGame() {
    score = 0;
    lives = 5; // 残機をリセット
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives; // 残機表示を更新
    bullets.length = 0; // 弾丸をクリア
    enemies.length = 0; // 敵をクリア
    resizeCanvas(); // Canvasサイズを初期化時に調整
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 10;
    gameRunning = false;
    startScreen.style.display = 'flex';
    gameOverScreen.style.display = 'none';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

// 描画関数
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawBullets() {
    ctx.fillStyle = 'yellow';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawEnemies() {
    ctx.fillStyle = 'red';
    enemies.forEach(enemy => {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

// 更新関数
function updatePlayer() {
    // キーボード入力
    if (keys.ArrowLeft || touch.left) {
        player.dx = -PLAYER_SPEED;
    } else if (keys.ArrowRight || touch.right) {
        player.dx = PLAYER_SPEED;
    } else {
        player.dx = 0;
    }

    player.x += player.dx;

    // 画面端での制限
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= BULLET_SPEED;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1); // 画面外に出たら削除
        }
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += ENEMY_SPEED;
        if (enemies[i].y > canvas.height) {
            enemies.splice(i, 1); // 画面外に出たら削除
            lives--; // 残機を減らす
            livesDisplay.textContent = lives; // 残機表示を更新
            if (lives <= 0) {
                endGame(); // 残機が0になったらゲームオーバー
                return;
            }
        }
    }
}

// 弾丸発射
function fireBullet() {
    const bullet = {
        x: player.x + player.width / 2 - 2.5,
        y: player.y,
        width: 5,
        height: 10,
        color: 'yellow'
    };
    bullets.push(bullet);
}

// 敵の生成
let lastEnemySpawnTime = 0;
function spawnEnemy(currentTime) {
    if (enemies.length < MAX_ENEMIES && currentTime - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) {
        const enemy = {
            x: Math.random() * (canvas.width - 30),
            y: -30, // 画面上部から出現
            width: 30,
            height: 30,
            color: 'red'
        };
        enemies.push(enemy);
        lastEnemySpawnTime = currentTime;
    }
}

// 衝突判定 (AABB)
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// 衝突処理
function handleCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], enemies[j])) {
                // 衝突したら両方を削除
                bullets.splice(i, 1);
                enemies.splice(j, 1);
                score += 100; // スコア加算
                scoreDisplay.textContent = score;
                break; // 弾丸は一度に一つの敵にしか当たらない
            }
        }
    }
}

// ゲームループ
function gameLoop(currentTime) {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Canvasをクリア

    updatePlayer();
    updateBullets();
    updateEnemies();
    spawnEnemy(currentTime);
    handleCollisions();

    drawPlayer();
    drawBullets();
    drawEnemies();

    animationFrameId = requestAnimationFrame(gameLoop);
}

// ゲーム開始
function startGame() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    gameRunning = true;
    score = 0;
    lives = 5; // ゲーム開始時に残機をリセット
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives; // 残機表示を更新
    bullets.length = 0;
    enemies.length = 0;
    lastEnemySpawnTime = 0; // 敵の出現時間をリセット
    player.x = canvas.width / 2 - player.width / 2; // プレイヤーの位置をリセット
    player.y = canvas.height - player.height - 10;
    animationFrameId = requestAnimationFrame(gameLoop);
}

// ゲーム終了
function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'flex';
}

// イベントリスナー
window.addEventListener('resize', resizeCanvas);

document.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        keys[e.code] = true;
    }
    if (e.code === 'Space' && gameRunning) {
        fireBullet();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
    }
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// タッチコントロールイベントリスナー
leftButton.addEventListener('touchstart', (e) => { e.preventDefault(); touch.left = true; }, { passive: false });
leftButton.addEventListener('touchend', (e) => { e.preventDefault(); touch.left = false; }, { passive: false });
leftButton.addEventListener('touchcancel', (e) => { e.preventDefault(); touch.left = false; }, { passive: false });

rightButton.addEventListener('touchstart', (e) => { e.preventDefault(); touch.right = true; }, { passive: false });
rightButton.addEventListener('touchend', (e) => { e.preventDefault(); touch.right = false; }, { passive: false });
rightButton.addEventListener('touchcancel', (e) => { e.preventDefault(); touch.right = false; }, { passive: false });

fireButton.addEventListener('touchstart', (e) => { e.preventDefault(); touch.fire = true; if (gameRunning) fireBullet(); }, { passive: false });
fireButton.addEventListener('touchend', (e) => { e.preventDefault(); touch.fire = false; }, { passive: false });
fireButton.addEventListener('touchcancel', (e) => { e.preventDefault(); touch.fire = false; }, { passive: false });


// 初期化呼び出し
window.onload = initGame;

// Service Worker の登録
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker 登録成功:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker 登録失敗:', error);
            });
    });
}
