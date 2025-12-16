const main = document.getElementById('main');
const ziziNormal = document.getElementById('ziziNormal');
const ziziFast = document.getElementById('ziziFast');
const displayScore = document.getElementById('scoreDisplay');

const timerBar = document.getElementById('timerBar');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreSpan = document.getElementById('finalScore');
const bestScoreSpan = document.getElementById('bestScore');

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


addEventListener('keydown', function(e) {
    if (isGameOver) return;

    if (e.code === 'Space') {

        if (isKeyDown) return;
            isKeyDown = true;

            if (!gameStarted) {
                startTimer();
            }

            if (isAnimationRunning) return;
                isAnimationRunning = true;
                const currentTime = Date.now();
                const timeDiff = currentTime - lastClickTime;
                lastClickTime = currentTime;

                clearTimeout(resetTimer);
                let multiplier = 1;
                if (timeDiff < 170) {
                    ziziFast.style.opacity = "1"; 
                    ziziNormal.style.opacity = "0";
                    multiplier = 2;
  
                    resetTimer = setTimeout(() => {
                        ziziFast.style.opacity = "0";
                        ziziNormal.style.opacity = "1";
                    }, 400);
                } else {
                    ziziFast.style.opacity = "0";
                    ziziNormal.style.opacity = "1";
                }

                let animDuration = Math.min(Math.max(timeDiff / 2.5, 50), 400);
                if (timeDiff > 2000) animDuration = 200;
                    main.style.transition = `all ${animDuration}ms ease-in-out`;
                    main.style.transform = "translate(-50%, calc(-50% - 150px))";
                    setTimeout(() => {
                        main.style.transform = "translate(-50%, -50%)";
                        point += multiplier;
                        if (multiplier === 2) {
                            displayScore.textContent = `Score : ${point} (x2!)`;
                            displayScore.style.color = "#ff4757";
                        } else {
                            displayScore.textContent = `Score : ${point}`;
                            displayScore.style.color = "#333";
                        }
                    setTimeout(() => {
                        isAnimationRunning = false; 
                    }, animDuration * 0.5);
                }, animDuration);
                
    }
});

document.addEventListener("keyup", function(e) {
    if (e.code == 'Space') {
        isKeyDown = false;
    }
});

window.restartGame = restartGame;