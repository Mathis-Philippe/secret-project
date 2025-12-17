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
const GAME_DURATION = 15000;
let timeLeft = GAME_DURATION;
let timerInterval;

window.point = point;
window.highScore = highScore;

// --- 3. FONCTIONS ---

function endGame() {
    isGameOver = true;
    gameStarted = false;
    clearInterval(timerInterval); // On arrête le chrono

    // Mise à jour du meilleur score
    if (point > highScore) {
        highScore = point;
        window.highScore = highScore;
    }

    // On remplit les scores dans l'HTML
    if (finalScoreSpan) finalScoreSpan.textContent = point;
    if (bestScoreSpan) bestScoreSpan.textContent = highScore;

    // AFFICHER L'ÉCRAN DE FIN + EFFET YAOURT
    // C'est ici que ça plantait avant si gameOverScreen n'était pas défini
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
    timeLeft = GAME_DURATION;
    isGameOver = false;
    gameStarted = false;

    // Reset visuel
    displayScore.textContent = `Score : 0`;
    displayScore.style.color = "#ffffff";
    timerBar.style.width = '100%';

    // CACHER L'ÉCRAN DE FIN
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

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        timeLeft = GAME_DURATION - elapsed;

        const percentage = (timeLeft / GAME_DURATION) * 100;
        if (timerBar) timerBar.style.width = `${percentage}%`;

        if (timeLeft <= 0) {
            if (timerBar) timerBar.style.width = `0%`;
            window.endGame();
        }
    }, 50);
}

window.startTimer = startTimer;
