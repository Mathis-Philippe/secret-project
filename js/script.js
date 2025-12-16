const main = document.getElementById('main');
const ziziNormal = document.getElementById('ziziNormal');
const ziziFast = document.getElementById('ziziFast');
const displayScore = document.getElementById('scoreDisplay');
const timerBar = document.getElementById('timerBar');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreSpan = document.getElementById('finalScore');
const bestScoreSpan = document.getElementById('bestScore');
const SUPABASE_URL = 'TON_URL_SUPABASE_ICI';
const SUPABASE_KEY = 'TA_CLE_ANON_PUBLIC_ICI';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null; 
let userProfile = null;

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

// --- 3. FONCTIONS ---

function endGame() {
    isGameOver = true;
    gameStarted = false;
    clearInterval(timerInterval); // On arrête le chrono

    // Mise à jour du meilleur score
    if (point > highScore) {
        highScore = point;
    }

    // On remplit les scores dans l'HTML
    if(finalScoreSpan) finalScoreSpan.textContent = point;
    if(bestScoreSpan) bestScoreSpan.textContent = highScore;

    // AFFICHER L'ÉCRAN DE FIN + EFFET YAOURT
    // C'est ici que ça plantait avant si gameOverScreen n'était pas défini
    if (gameOverScreen) {
        gameOverScreen.classList.remove('hidden');
        gameOverScreen.classList.add('yogurt-background');
    }
}

function restartGame() {
    point = 0;
    timeLeft = GAME_DURATION;
    isGameOver = false;
    gameStarted = false;
    
    // Reset visuel
    displayScore.textContent = `Score : 0`;
    displayScore.style.color = "#333";
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

// On attache la fonction à la fenêtre pour que le bouton HTML puisse cliquer dessus
window.restartGame = restartGame;

function startTimer() {
    gameStarted = true;
    const startTime = Date.now();
    
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        timeLeft = GAME_DURATION - elapsed;

        const percentage = (timeLeft / GAME_DURATION) * 100;
        if(timerBar) timerBar.style.width = `${percentage}%`;

        if (timeLeft <= 0) {
            if(timerBar) timerBar.style.width = `0%`;
            endGame(); // Lancement de la fin
        }
    }, 50);
}
