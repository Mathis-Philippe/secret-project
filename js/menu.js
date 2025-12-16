const menuProfile = document.getElementById('menuProfile');
const menuLeaderboard = document.getElementById('menuLeaderboard');
const menuShop = document.getElementById('menuShop');

// Gestion ouverture menus
document.getElementById('btnProfile').addEventListener('click', () => toggleMenu(menuProfile));
document.getElementById('btnLeaderboard').addEventListener('click', () => {
    toggleMenu(menuLeaderboard);
    updateLeaderboard(); // On charge le classement quand on ouvre
});
document.getElementById('btnShop').addEventListener('click', () => toggleMenu(menuShop));

function toggleMenu(menu) {
    const isActive = menu.classList.contains('active');
    closeAllMenus();
    if (!isActive) menu.classList.add('active');
}

function closeAllMenus() {
    menuProfile.classList.remove('active');
    menuLeaderboard.classList.remove('active');
    menuShop.classList.remove('active');
}

// --- LOGIQUE SUPABASE ---

let coins = 100; // Valeur par défaut si hors ligne

function updateUI() {
    const userCoinsSpan = document.getElementById('userCoins');
    const shopCoinsSpan = document.getElementById('shopCoins');
    if(userCoinsSpan) userCoinsSpan.textContent = coins;
    if(shopCoinsSpan) shopCoinsSpan.textContent = coins;
}

// 1. CONNEXION / INSCRIPTION
window.loginUser = async function() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const btn = document.querySelector('.action-btn'); // On récupère le bouton

    if (!email || !password) return alert("Remplis tout !");

    // 1. On désactive le bouton pour éviter le double-clic
    btn.disabled = true;
    btn.textContent = "Chargement...";

    try {
        // Essaie de se connecter
        let { data, error } = await window.sbClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        // Si compte inexistant (erreur 400), on tente de créer le compte
        if (error) {
            // C'est ici que l'erreur 429 peut arriver si on spamme
            const signUp = await window.sbClient.auth.signUp({
                email: email,
                password: password,
            });
            
            if (signUp.error) {
                // Si c'est une erreur 429, on prévient l'utilisateur
                if (signUp.error.status === 429) {
                    alert("Trop de tentatives ! Attends un peu.");
                } else {
                    alert("Erreur: " + signUp.error.message);
                }
                return;
            }
            
            data = signUp.data;
            if (data.user) {
                // Création du profil initial
                await window.sbClient.from('profiles').insert([
                    { id: data.user.id, username: email.split('@')[0], coins: 100, high_score: 0 }
                ]);
                alert("Compte créé ! Tu es connecté.");
            }
        }

        if (data.user) {
            handleLoginSuccess(data.user);
        }
    } finally {
        // Quoi qu'il arrive, on réactive le bouton à la fin
        btn.disabled = false;
        btn.textContent = "Se connecter / S'inscrire";
    }
};

async function handleLoginSuccess(user) {
    window.currentUser = user;
    
    // Récupérer les infos du profil
    const { data, error } = await window.sbClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (data) {
        window.userProfile = data;
        coins = data.coins || 100;
        
        // Met à jour le highscore global du jeu avec celui de la BDD
        window.highScore = data.high_score || 0;
        
        // UI
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('profileInfo').classList.remove('hidden');
        document.getElementById('displayUsername').textContent = data.username;
        document.getElementById('profileHighScore').textContent = window.highScore;
        updateUI();
    }
}

window.logoutUser = async function() {
    await window.sbClient.auth.signOut();
    window.currentUser = null;
    window.userProfile = null;
    coins = 100; // Reset visuel
    window.highScore = 0;
    
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('profileInfo').classList.add('hidden');
    updateUI();
};

// 2. SAUVEGARDE FIN DE JEU (Surcharge de la fonction script.js)
window.endGame = async function() {
    // Appel de la fonction originale pour l'affichage (Game Over screen etc)
    window.originalEndGame();

    // Calcul gain
    const currentPoints = window.point; // variable globale mise à jour par script.js
    const coinsEarned = Math.floor(currentPoints / 10);
    coins += coinsEarned;
    updateUI();

    // Sauvegarde en base si connecté
    if (window.currentUser) {
        const newHighScore = Math.max(window.highScore, currentPoints);
        
        const updates = {
            id: window.currentUser.id,
            coins: coins,
            high_score: newHighScore,
            updated_at: new Date()
        };

        const { error } = await window.sbClient
            .from('profiles')
            .upsert(updates);
            
        if (!error) {
            console.log("Sauvegardé sur Supabase !");
            // Mettre à jour l'affichage local du profil
            document.getElementById('profileHighScore').textContent = newHighScore;
        }
    }
};

// 3. CLASSEMENT
async function updateLeaderboard() {
    const listElement = document.querySelector('.leaderboard-list');
    listElement.innerHTML = '<li>Chargement...</li>';

    const { data, error } = await window.sbClient
        .from('profiles')
        .select('username, high_score')
        .order('high_score', { ascending: false })
        .limit(10);

    if (data) {
        listElement.innerHTML = '';
        data.forEach((player, index) => {
            let medal = '';
            if (index === 0) medal = '🥇 ';
            if (index === 1) medal = '🥈 ';
            if (index === 2) medal = '🥉 ';
            
            const li = document.createElement('li');
            li.innerHTML = `<span>${medal}${index + 1}. ${player.username}</span> <span>${player.high_score}</span>`;
            
            if (index === 0) li.style.color = 'gold';
            if (index === 1) li.style.color = 'silver';
            if (index === 2) li.style.color = '#cd7f32';
            
            listElement.appendChild(li);
        });
    }
}

// Vérification session au chargement de la page
window.addEventListener('load', async () => {
    const { data } = await window.sbClient.auth.getSession();
    if (data.session) {
        handleLoginSuccess(data.session.user);
    }
    updateUI();
});