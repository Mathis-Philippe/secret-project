let point = 0;
let highScore = 0;
let isKeyDown = false;
let isAnimationRunning = false;
let lastClickTime = Date.now();
let resetTimer;

let gameStarted = false;
let isGameOver = false;
const GAME_DURATION = 15000;
let timeLeft = GAME_DURATION;
let timerInterval

function endGame() {
    isGameOver = true;
    gameStarted = false;
    clearInterval(timerInterval);

    if (point > highScore) {
        highScore = point;
    }

    finalScoreSpan.textContent = point;
    bestScoreSpan.textContent = highScore;
    gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    point = 0;
    timeLeft = GAME_DURATION;
    isGameOver = false;
    gameStarted = false;
    
    displayScore.textContent = `Score : 0`;
    timerBar.style.width = '100%';
    gameOverScreen.classList.add('hidden');
    
    ziziFast.style.opacity = "0";
    ziziNormal.style.opacity = "1";
    lastClickTime = Date.now();
}

function startTimer() {
    gameStarted = true;
    const startTime = Date.now();
    
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        timeLeft = GAME_DURATION - elapsed;

        const percentage = (timeLeft / GAME_DURATION) * 100;
        timerBar.style.width = `${percentage}%`;

        if (timeLeft <= 0) {
            timerBar.style.width = `0%`;
            endGame();
        }
    }, 50);
}


window.restartGame = restartGame;