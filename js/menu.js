const menuProfile = document.getElementById('menuProfile');
const menuLeaderboard = document.getElementById('menuLeaderboard');
const menuShop = document.getElementById('menuShop');

// Variables globales
let currentLeaderboardTab = 'global'; 
let coins = 100;
window.shopItemsCache = []; 

// Gestion ouverture menus
document.getElementById('btnProfile').addEventListener('click', () => {
    toggleMenu(menuProfile);
    if (window.currentUser) renderInventory(); // Charge l'inventaire dans le profil
});

document.getElementById('btnLeaderboard').addEventListener('click', () => {
    toggleMenu(menuLeaderboard);
    updateLeaderboard(); 
});

document.getElementById('btnShop').addEventListener('click', () => {
    toggleMenu(menuShop);
    renderShop(); // Charge les articles à acheter dans la boutique
});

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

function updateUI() {
    const userCoinsSpan = document.getElementById('userCoins');
    const shopCoinsSpan = document.getElementById('shopCoins');
    if(userCoinsSpan) userCoinsSpan.textContent = coins;
    if(shopCoinsSpan) shopCoinsSpan.textContent = coins;
}

// ==========================================
// 1. AUTHENTIFICATION
// ==========================================

window.loginUser = async function() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const btn = document.querySelector('.action-btn');

    if (!email || !password) return alert("Remplis tout !");
    btn.disabled = true;
    btn.textContent = "Chargement...";

    try {
        let { data, error } = await window.sbClient.auth.signInWithPassword({ email, password });

        if (error) {
            const signUp = await window.sbClient.auth.signUp({ email, password });
            if (signUp.error) {
                alert("Erreur : " + signUp.error.message);
                btn.disabled = false; return;
            }
            if (signUp.data.user) {
                window.currentUser = signUp.data.user;
                document.getElementById('loginSection').classList.add('hidden');
                document.getElementById('selectPseudo').classList.remove('hidden');
                btn.disabled = false; return; 
            }
        }
        if (data.user) await handleLoginSuccess(data.user);

    } catch (err) {
        console.error(err);
        alert("Erreur système.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Se connecter / S'inscrire";
    }
};

window.setUsername = async function() {
    const pseudo = document.getElementById('pseudoInput').value;
    if (!pseudo || pseudo.trim() === "") return alert("Choisis un pseudo !");
    
    try {
        const { error } = await window.sbClient.from('profiles').insert([
            { id: window.currentUser.id, username: pseudo, coins: 100, high_score: 0 }
        ]);
        if (error) throw error;

        document.getElementById('selectPseudo').classList.add('hidden');
        await handleLoginSuccess(window.currentUser);
        alert("Bienvenue " + pseudo + " !");
    } catch (err) {
        console.error(err);
        alert("Erreur création profil.");
    }
};

async function handleLoginSuccess(user) {
    window.currentUser = user;
    
    // On charge le catalogue (items)
    if (window.shopItemsCache.length === 0) await loadShopItems();

    const { data } = await window.sbClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (data) {
        window.userProfile = data;
        coins = data.coins || 100;
        window.highScore = data.high_score || 0;
        
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('selectPseudo').classList.add('hidden');
        document.getElementById('profileInfo').classList.remove('hidden');
        document.getElementById('displayUsername').textContent = data.username;
        document.getElementById('profileHighScore').textContent = window.highScore;
        
        updateUI();
        applyCosmetics(); 
    }
}

window.logoutUser = async function() {
    await window.sbClient.auth.signOut();
    window.currentUser = null;
    window.userProfile = null;
    coins = 100; 
    window.highScore = 0;
    
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('profileInfo').classList.add('hidden');
    
    // Reset visuel
    document.getElementById('ziziNormal').src = 'img/penis.png';
    document.body.style.backgroundColor = '#727272';
    document.getElementById('handImage').src = 'img/fist.png';
    
    updateUI();
};

// ==========================================
// 2. FIN DE JEU (CORRECTIF BUG SCORE)
// ==========================================

window.endGame = async function() {
    window.originalEndGame(); // Affiche l'écran de fin

    const scoreText = document.getElementById('finalScore').textContent;
    const currentPoints = parseInt(scoreText) || 0;
    
    // Calcul pièces (1 point = 0.64 pièce)
    const coinsEarned = Math.floor(currentPoints * 0.64);
    
    // Animation visuelle des pièces
    const animDiv = document.getElementById('coinAnimation');
    if (animDiv && coinsEarned > 0) {
        animDiv.innerHTML = `+ ${coinsEarned} <i class="fa-solid fa-coins"></i>`;
        animDiv.className = 'coin-animation animate-pop'; 
        animDiv.classList.remove('hidden');
        setTimeout(() => animDiv.classList.add('hidden'), 2500);
    }

    // SAUVEGARDE SÉCURISÉE
    if (window.currentUser) {
        // A. On récupère les VRAIES données actuelles de la base (pour éviter l'écrasement)
        const { data: profileData } = await window.sbClient
            .from('profiles')
            .select('high_score, coins, username')
            .eq('id', window.currentUser.id)
            .single();

        let dbHighScore = profileData ? profileData.high_score : 0;
        let dbCoins = profileData ? profileData.coins : 0;
        const currentUsername = profileData ? profileData.username : 'Joueur';

        // B. AUTO-RÉPARATION : On vérifie si un meilleur score existe dans l'historique daily
        // (Cela va réparer ton bug actuel dès ta prochaine partie)
        const { data: bestDaily } = await window.sbClient
            .from('daily_scores')
            .select('score')
            .eq('user_id', window.currentUser.id)
            .order('score', { ascending: false })
            .limit(1)
            .maybeSingle(); // maybeSingle évite l'erreur si vide
        
        if (bestDaily && bestDaily.score > dbHighScore) {
            console.log("Bug détecté ! Récupération de l'ancien meilleur score daily:", bestDaily.score);
            dbHighScore = bestDaily.score;
        }

        // C. Calcul des nouvelles valeurs
        const newHighScore = Math.max(dbHighScore, currentPoints); // On garde le meilleur des deux
        const newTotalCoins = dbCoins + coinsEarned;

        // D. Mise à jour locale
        window.highScore = newHighScore;
        coins = newTotalCoins;
        document.getElementById('profileHighScore').textContent = newHighScore;
        updateUI();

        // E. Envoi sécurisé au Serveur (Profil Global)
        await window.sbClient.from('profiles').upsert({
            id: window.currentUser.id,
            username: currentUsername,
            high_score: newHighScore,
            coins: newTotalCoins,
            updated_at: new Date()
        });

        // F. Mise à jour Daily (Score du jour)
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: todayData } = await window.sbClient
            .from('daily_scores')
            .select('score')
            .eq('user_id', window.currentUser.id)
            .eq('played_at', todayStr)
            .maybeSingle();

        if (!todayData || currentPoints > todayData.score) {
            await window.sbClient.from('daily_scores').upsert({
                user_id: window.currentUser.id,
                username: currentUsername, 
                score: currentPoints,
                played_at: todayStr
            });
        }
    }
};

// ==========================================
// 3. CLASSEMENT
// ==========================================

window.switchLeaderboard = function(type) {
    currentLeaderboardTab = type;
    document.getElementById('tabGlobal').classList.toggle('active', type === 'global');
    document.getElementById('tabDaily').classList.toggle('active', type === 'daily');
    updateLeaderboard();
};

async function updateLeaderboard() {
    const listElement = document.querySelector('.leaderboard-list');
    listElement.innerHTML = '<li>Chargement...</li>';

    let query;
    if (currentLeaderboardTab === 'daily') {
        const todayStr = new Date().toISOString().split('T')[0];
        query = window.sbClient.from('daily_scores')
            .select('username, score').eq('played_at', todayStr)
            .order('score', { ascending: false }).limit(100);
    } else {
        query = window.sbClient.from('profiles')
            .select('username, high_score')
            .order('high_score', { ascending: false }).limit(100);
    }

    const { data } = await query;
    listElement.innerHTML = '';
    
    if (data && data.length > 0) {
        data.forEach((player, index) => {
            let medal = index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : '';
            const score = player.high_score !== undefined ? player.high_score : player.score;
            const li = document.createElement('li');
            li.innerHTML = `<span>${medal}${index + 1}. ${player.username}</span> <span>${score}</span>`;
            if (index < 3) li.style.color = ['gold', 'silver', '#cd7f32'][index];
            listElement.appendChild(li);
        });
    } else {
        listElement.innerHTML = '<li>Aucun score.</li>';
    }
}

// ==========================================
// 4. BOUTIQUE & INVENTAIRE (SÉPARÉS)
// ==========================================

window.loadShopItems = async function() {
    const { data } = await window.sbClient.from('shop_items').select('*').order('price', { ascending: true });
    if (data) window.shopItemsCache = data;
};

// A. BOUTIQUE (ACHAT UNIQUEMENT)
window.renderShop = async function() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    if (window.shopItemsCache.length === 0) await loadShopItems();

    // On regarde ce qu'on possède
    let ownedItems = ['skin_default', 'hand_default'];
    if (window.currentUser) {
        const { data } = await window.sbClient.from('inventory').select('item_id').eq('user_id', window.currentUser.id);
        if (data) ownedItems = [...ownedItems, ...data.map(i => i.item_id)];
    }

    grid.innerHTML = '';

    // On affiche QUE les items payants
    const itemsToSell = window.shopItemsCache.filter(item => item.price > 0);

    itemsToSell.forEach(item => {
        const isOwned = ownedItems.includes(item.id);
        const itemDiv = document.createElement('div');
        itemDiv.className = `shop-item ${isOwned ? 'equipped' : ''}`; // Juste pour griser un peu

        const previewHtml = (item.preview_val && item.preview_val.startsWith('fa-')) 
            ? `<div class="item-preview"><i class="${item.preview_val}"></i></div>`
            : `<div class="item-preview" style="background: ${item.preview_val || '#ccc'};"></div>`;

        let buttonHtml;
        if (isOwned) {
            // Pas de bouton équiper ici, juste "Possédé"
            buttonHtml = `<button class="buy-btn" style="background:#555; cursor:default;" disabled>Possédé</button>`;
        } else {
            buttonHtml = `<button class="buy-btn" onclick="buyItem('${item.id}', ${item.price})">${item.price} <i class="fa-solid fa-coins"></i></button>`;
        }

        itemDiv.innerHTML = `${previewHtml}<p>${item.name}</p>${buttonHtml}`;
        grid.appendChild(itemDiv);
    });
};

// B. INVENTAIRE (ÉQUIPEMENT UNIQUEMENT)
window.renderInventory = async function() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid || !window.currentUser) return;
    if (window.shopItemsCache.length === 0) await loadShopItems();

    // Récupération inventaire
    let ownedIds = ['skin_default', 'hand_default'];
    const { data } = await window.sbClient.from('inventory').select('item_id').eq('user_id', window.currentUser.id);
    if (data) ownedIds = [...ownedIds, ...data.map(i => i.item_id)];

    // Récupération équipement actuel
    const currentSkin = window.userProfile.equipped_skin || 'skin_default';
    const currentBg = window.userProfile.equipped_bg || 'default';
    const currentHand = window.userProfile.equipped_hand || 'hand_default';

    grid.innerHTML = '';

    // On filtre : on montre QUE ce qu'on possède
    const myItems = window.shopItemsCache.filter(item => ownedIds.includes(item.id));

    myItems.forEach(item => {
        let isEquipped = false;
        // Vérification par type pour assurer "Un seul de chaque type"
        if (item.type === 'skin' && currentSkin === item.id) isEquipped = true;
        if (item.type === 'bg' && currentBg === item.id) isEquipped = true;
        if (item.type === 'hand' && currentHand === item.id) isEquipped = true;

        const itemDiv = document.createElement('div');
        itemDiv.className = `shop-item ${isEquipped ? 'equipped' : ''}`;
        
        const previewHtml = (item.preview_val && item.preview_val.startsWith('fa-')) 
            ? `<div class="item-preview"><i class="${item.preview_val}"></i></div>`
            : `<div class="item-preview" style="background: ${item.preview_val || '#ccc'};"></div>`;

        let btnStyle = isEquipped ? 'background:#2ed573; border:none;' : 'background:#3498db; border:none;';
        let btnText = isEquipped ? 'Actif' : 'Équiper';
        
        itemDiv.innerHTML = `
            ${previewHtml}
            <p style="font-size:0.8em; margin:5px 0;">${item.name}</p>
            <button class="action-btn" style="width:100%; padding:5px; ${btnStyle}" 
                onclick="equipItem('${item.id}', '${item.type}')" 
                ${isEquipped ? 'disabled' : ''}>${btnText}</button>
        `;
        grid.appendChild(itemDiv);
    });
};

window.buyItem = async function(itemId, price) {
    if (coins < price) return alert("Pas assez de pièces !");
    
    // Achat
    const { error: coinErr } = await window.sbClient.from('profiles').update({ coins: coins - price }).eq('id', window.currentUser.id);
    if (coinErr) return alert("Erreur serveur.");

    await window.sbClient.from('inventory').insert([{ user_id: window.currentUser.id, item_id: itemId }]);

    coins -= price;
    updateUI();
    alert("Achat réussi !");
    renderShop(); // Refresh boutique pour griser le bouton
};

window.equipItem = async function(itemId, type) {
    let update = {};
    if (type === 'skin') update = { equipped_skin: itemId };
    if (type === 'bg') update = { equipped_bg: itemId };
    if (type === 'hand') update = { equipped_hand: itemId };

    const { error } = await window.sbClient.from('profiles').update(update).eq('id', window.currentUser.id);

    if (!error) {
        if (type === 'skin') window.userProfile.equipped_skin = itemId;
        if (type === 'bg') window.userProfile.equipped_bg = itemId;
        if (type === 'hand') window.userProfile.equipped_hand = itemId;
        
        applyCosmetics();
        renderInventory(); // Refresh inventaire pour déplacer le badge "Actif"
    }
};

window.applyCosmetics = function() {
    if (!window.userProfile) return;

    // 1. ZIZI
    const skinId = window.userProfile.equipped_skin || 'skin_default';
    const ziziNormal = document.getElementById('ziziNormal');
    const skinItem = window.shopItemsCache.find(i => i.id === skinId);
    if (skinItem && skinItem.resource_val) ziziNormal.src = `img/${skinItem.resource_val}`;
    else ziziNormal.src = 'img/penis.png';

    // 2. MAIN
    const handId = window.userProfile.equipped_hand || 'hand_default';
    const handImg = document.getElementById('handImage');
    const handItem = window.shopItemsCache.find(i => i.id === handId);
    if (handItem && handItem.resource_val) handImg.src = `img/${handItem.resource_val}`;
    else handImg.src = 'img/fist.png';

    // 3. FOND
    const bgId = window.userProfile.equipped_bg || 'default';
    const bgItem = window.shopItemsCache.find(i => i.id === bgId);
    if (bgItem && bgItem.resource_val) document.body.style.backgroundColor = bgItem.resource_val;
    else document.body.style.backgroundColor = '#727272';
};

// Initialisation
window.addEventListener('load', async () => {
    loadShopItems();
    const { data } = await window.sbClient.auth.getSession();
    if (data.session) handleLoginSuccess(data.session.user);
    updateUI();
});