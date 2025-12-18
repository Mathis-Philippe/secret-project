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

// --- VARIABLES JEU ---
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

// --- VARIABLES MOTS BONUS (TYPING) ---
const wordContainer = document.getElementById('wordContainer');
let wordTimer; 
window.currentWordObj = null; // IMPORTANT : On l'initialise directement sur window

// Liste de mots (tu peux en rajouter)
const WORDS_LIST = ["MACRON", "ZIZI", "SPERME", "FOUTRE", "SQUEEZIE", "KOMBUCHA", "BALOCHE", "PHP", "CUM", "GOONING", "SEXE", "FOUFOUNE", "FIST", "HARDWARE", "JOUIR"];

// Variables globales exposées pour les autres scripts
window.point = point;
window.highScore = highScore;


// --- FONCTIONS ---

function endGame() {
    isGameOver = true;
    gameStarted = false;
    clearInterval(timerInterval);

    // ARRET DES MOTS
    clearTimeout(wordTimer);
    if (window.currentWordObj && window.currentWordObj.element) {
        window.currentWordObj.element.remove();
        window.currentWordObj = null;
    }

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
    
    // On remet la durée de base
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

    // RESET MOTS
    if (window.currentWordObj) {
        if (window.currentWordObj.element) window.currentWordObj.element.remove();
        window.currentWordObj = null;
    }
    clearTimeout(wordTimer);
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

    // LANCEMENT DES MOTS ALEATOIRES
    scheduleNextWord();
}

window.startTimer = startTimer;

// --- GESTION DES MOTS ---

function scheduleNextWord() {
    if (isGameOver) return;
    
    // Temps aléatoire entre 4 et 8 secondes
    const randomDelay = Math.random() * 4000 + 4000; 
    
    wordTimer = setTimeout(() => {
        spawnWord();
    }, randomDelay);
}

function spawnWord() {
    if (isGameOver || !gameStarted) return;
    // Si un mot est déjà là, on attend encore un peu
    if (window.currentWordObj) {
        scheduleNextWord();
        return;
    }

    // 1. Choisir un mot
    const text = WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)];
    
    // 2. Créer l'élément HTML
    const div = document.createElement('div');
    div.classList.add('floating-word');
    
    text.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char;
        div.appendChild(span);
    });

    wordContainer.appendChild(div);

    // 3. Positionnement (Eviter le milieu)
    let x, y;
    const padding = 50; 
    const side = Math.floor(Math.random() * 4); // 0: Haut, 1: Bas, 2: Gauche, 3: Droite
    
    const maxX = window.innerWidth - 200; // estimation largeur mot
    const maxY = window.innerHeight - 100; // estimation hauteur mot

    if (side === 0) { // Haut
        x = Math.random() * maxX;
        y = Math.random() * (window.innerHeight * 0.2);
    } else if (side === 1) { // Bas
        x = Math.random() * maxX;
        y = (window.innerHeight * 0.7) + Math.random() * (window.innerHeight * 0.1);
    } else if (side === 2) { // Gauche
        x = Math.random() * (window.innerWidth * 0.2);
        y = Math.random() * maxY;
    } else { // Droite
        x = (window.innerWidth * 0.7) + Math.random() * (window.innerWidth * 0.1);
        y = Math.random() * maxY;
    }

    // Sécurité bornes
    if(x < padding) x = padding;
    if(y < padding) y = padding;

    div.style.left = `${x}px`;
    div.style.top = `${y}px`;

    // 4. Stocker l'état DANS WINDOW pour que index.js le voie
    window.currentWordObj = {
        text: text,
        index: 0, 
        element: div,
        spans: div.querySelectorAll('span')
    };
}

// Exposer les fonctions
window.spawnWord = spawnWord;
window.scheduleNextWord = scheduleNextWord;