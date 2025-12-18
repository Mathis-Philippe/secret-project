const SUPABASE_URL = 'https://eicbafnrqoccdadvpkzt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpY2JhZm5ycW9jY2RhZHZwa3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTE0MDIsImV4cCI6MjA4MTQ2NzQwMn0.WBTHHYCj0w6NgJmN5uQkOv9uSnym5TwKz6hGNFapu_k';

window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.currentUser = null;
window.userProfile = null;

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
const BASE_GAME_DURATION = 15000; // Durée de base
let timeLeft = BASE_GAME_DURATION;
let timerInterval;

window.point = point;
window.highScore = highScore;

// --- FONCTIONS ---

function endGame() {
    isGameOver = true;
    gameStarted = false;
    clearInterval(timerInterval);

    if (point > highScore) {
        highScore = point;
        window.highScore = highScore;
    }

    if (finalScoreSpan) finalScoreSpan.textContent = point;
    if (bestScoreSpan) bestScoreSpan.textContent = highScore;

    if (gameOverScreen) {
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.classList.add('yogurt-background');
    }
}

window.originalEndGame = endGame;
window.endGame = endGame;

function restartGame() {
    point = 0;
    window.point = 0;
    
    // On remet la durée de base pour l'instant (sera recalculée au start)
    timeLeft = BASE_GAME_DURATION; 
    
    isGameOver = false;
    gameStarted = false;

    displayScore.textContent = `Score : 0`;
    displayScore.style.color = "#ffffff";
    timerBar.style.width = '100%';

    if (gameOverScreen) {
        gameOverScreen.classList.add('hidden');
        gameOverScreen.classList.remove('yogurt-background');
    }

    ziziFast.style.opacity = "0";
    ziziNormal.style.opacity = "1";
    lastClickTime = Date.now();
}

window.restartGame = restartGame;

function startTimer() {
    gameStarted = true;
    const startTime = Date.now();

    // CALCUL DU TEMPS TOTAL AVEC BONUS
    const bonusTime = (window.activeBonuses && window.activeBonuses.timeAdd) ? window.activeBonuses.timeAdd : 0;
    const totalDuration = BASE_GAME_DURATION + bonusTime;

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        timeLeft = totalDuration - elapsed;

        const percentage = (timeLeft / totalDuration) * 100;
        if (timerBar) timerBar.style.width = `${percentage}%`;

        if (timeLeft <= 0) {
            if (timerBar) timerBar.style.width = `0%`;
            window.endGame();
        }
    }, 50);
}

window.startTimer = startTimer;