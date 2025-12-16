const menuProfile = document.getElementById('menuProfile');
const menuLeaderboard = document.getElementById('menuLeaderboard');
const menuShop = document.getElementById('menuShop');

// Boutons d'ouverture (ceux qu'on a créés avant)
document.getElementById('btnProfile').addEventListener('click', () => toggleMenu(menuProfile));
document.getElementById('btnLeaderboard').addEventListener('click', () => toggleMenu(menuLeaderboard));
document.getElementById('btnShop').addEventListener('click', () => toggleMenu(menuShop));

// Fonction pour ouvrir/fermer un menu
function toggleMenu(menu) {
    const isActive = menu.classList.contains('active');
    
    // On ferme d'abord tous les menus pour éviter la superposition
    closeAllMenus();
    
    // Si le menu n'était pas ouvert, on l'ouvre
    if (!isActive) {
        menu.classList.add('active');
    }
}

function closeAllMenus() {
    menuProfile.classList.remove('active');
    menuLeaderboard.classList.remove('active');
    menuShop.classList.remove('active');
}

// --- SYSTEME DE LOGIN (SIMULÉ) ---
let currentUser = null;
let coins = 100; // On donne 100 pièces de base

function updateUI() {
    // Met à jour les affichages de pièces
    const userCoinsSpan = document.getElementById('userCoins');
    const shopCoinsSpan = document.getElementById('shopCoins');
    if(userCoinsSpan) userCoinsSpan.textContent = coins;
    if(shopCoinsSpan) shopCoinsSpan.textContent = coins;
}

window.loginUser = function() {
    const usernameInput = document.getElementById('usernameInput');
    const name = usernameInput.value || "Joueur";
    
    currentUser = name;
    
    // Cache le form, montre les infos
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('profileInfo').classList.remove('hidden');
    document.getElementById('displayUsername').textContent = name;
    
    // On met à jour le highscore affiché dans le profil
    document.getElementById('profileHighScore').textContent = highScore;
    
    updateUI();
    alert(`Bienvenue ${name} !`);
};

window.logoutUser = function() {
    currentUser = null;
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('profileInfo').classList.add('hidden');
};


const originalEndGame = endGame; 

endGame = function() {
    // Appelle la fonction originale pour gérer le score, game over screen, etc.
    originalEndGame();
    
    // Ajout : On gagne des pièces égales à 10% du score (exemple)
    const coinsEarned = Math.floor(point / 10);
    coins += coinsEarned;
    updateUI();
    
    console.log(`Tu as gagné ${coinsEarned} pièces ! Total: ${coins}`);
};

// Initialisation au chargement
updateUI();