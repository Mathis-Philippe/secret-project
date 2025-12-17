const menuProfile = document.getElementById('menuProfile');
const menuLeaderboard = document.getElementById('menuLeaderboard');
const menuShop = document.getElementById('menuShop');

// Variables globales
let currentLeaderboardTab = 'global'; 
let coins = 100;
window.shopItemsCache = []; 

// NOUVEAU : Variables pour les filtres
let currentShopFilter = 'all';
let currentInvFilter = 'all';

// Gestion ouverture menus
document.getElementById('btnProfile').addEventListener('click', () => {
    toggleMenu(menuProfile);
    if (window.currentUser) renderInventory(); 
});

document.getElementById('btnLeaderboard').addEventListener('click', () => {
    toggleMenu(menuLeaderboard);
    updateLeaderboard(); 
});

document.getElementById('btnShop').addEventListener('click', () => {
    toggleMenu(menuShop);
    renderShop(); 
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
            { 
                id: window.currentUser.id, 
                username: pseudo, 
                coins: 100, 
                high_score: 0,
                equipped_skin: 'skin_default',
                equipped_hand: 'hand_default',
                equipped_bg: 'default',
                equipped_sound: 'sound_default'
            }
        ]);
        if (error) throw error;

        document.getElementById('selectPseudo').classList.add('hidden');
        await handleLoginSuccess(window.currentUser);
    } catch (err) {
        console.error(err);
        alert("Erreur création profil.");
    }
};

async function handleLoginSuccess(user) {
    window.currentUser = user;
    
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
        renderInventory(); 
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
    document.getElementById('gameEndSound').src = '';
    
    updateUI();
};

// ==========================================
// 2. FIN DE JEU
// ==========================================

window.endGame = async function() {
    window.originalEndGame(); 

    const audioPlayer = document.getElementById('gameEndSound');
    if (audioPlayer && audioPlayer.src) {
        audioPlayer.currentTime = 0;
        audioPlayer.play().catch(e => console.log("Erreur audio:", e));
    }

    const scoreText = document.getElementById('finalScore').textContent;
    const currentPoints = parseInt(scoreText) || 0;
    const coinsEarned = Math.floor(currentPoints * 0.64);
    
    const animDiv = document.getElementById('coinAnimation');
    if (animDiv && coinsEarned > 0) {
        animDiv.innerHTML = `+ ${coinsEarned} <i class="fa-solid fa-coins"></i>`;
        animDiv.className = 'coin-animation animate-pop'; 
        animDiv.classList.remove('hidden');
        setTimeout(() => animDiv.classList.add('hidden'), 2500);
    }

    if (window.currentUser) {
        const { data: profileData } = await window.sbClient
            .from('profiles')
            .select('high_score, coins, username')
            .eq('id', window.currentUser.id)
            .single();

        let dbHighScore = profileData ? profileData.high_score : 0;
        let dbCoins = profileData ? profileData.coins : 0;
        const currentUsername = profileData ? profileData.username : 'Joueur';

        const { data: bestDaily } = await window.sbClient
            .from('daily_scores')
            .select('score')
            .eq('user_id', window.currentUser.id)
            .order('score', { ascending: false })
            .limit(1)
            .maybeSingle(); 
        
        if (bestDaily && bestDaily.score > dbHighScore) {
            dbHighScore = bestDaily.score;
        }

        const newHighScore = Math.max(dbHighScore, currentPoints); 
        const newTotalCoins = dbCoins + coinsEarned;

        window.highScore = newHighScore;
        coins = newTotalCoins;
        document.getElementById('profileHighScore').textContent = newHighScore;
        updateUI();

        await window.sbClient.from('profiles').upsert({
            id: window.currentUser.id,
            username: currentUsername,
            high_score: newHighScore,
            coins: newTotalCoins,
            updated_at: new Date()
        });

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
// 4. BOUTIQUE & INVENTAIRE (AVEC FILTRES)
// ==========================================

window.loadShopItems = async function() {
    const { data } = await window.sbClient.from('shop_items').select('*').order('price', { ascending: true });
    if (data) window.shopItemsCache = data;
};

// --- GESTION DES FILTRES ---

window.filterShop = function(type, btnElement) {
    currentShopFilter = type;
    // Visuel des boutons
    document.querySelectorAll('#shopFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    // Recharger
    renderShop();
};

window.filterInventory = function(type, btnElement) {
    currentInvFilter = type;
    // Visuel des boutons
    document.querySelectorAll('#invFilters .filter-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    // Recharger
    renderInventory();
};


// A. BOUTIQUE
window.renderShop = async function() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    if (window.shopItemsCache.length === 0) await loadShopItems();

    let ownedItems = ['skin_default', 'hand_default', 'skin_black', 'sound_default'];
    
    if (window.currentUser) {
        const { data } = await window.sbClient.from('inventory').select('item_id').eq('user_id', window.currentUser.id);
        if (data) ownedItems = [...ownedItems, ...data.map(i => i.item_id)];
    }

    grid.innerHTML = '';
    
    // FILTRE ICI : On filtre par prix ET par type sélectionné
    const itemsToSell = window.shopItemsCache.filter(item => {
        const isSellable = item.price > 0;
        const matchesFilter = (currentShopFilter === 'all') || (item.type === currentShopFilter);
        return isSellable && matchesFilter;
    });

    if (itemsToSell.length === 0) {
        grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:#888;">Aucun objet dans cette catégorie.</p>';
        return;
    }

    itemsToSell.forEach(item => {
        const isOwned = ownedItems.includes(item.id);
        const itemDiv = document.createElement('div');
        itemDiv.className = `shop-item ${isOwned ? 'equipped' : ''}`;

        const previewHtml = (item.preview_val && item.preview_val.startsWith('fa-')) 
            ? `<div class="item-preview"><i class="${item.preview_val}"></i></div>`
            : `<div class="item-preview" style="background: ${item.preview_val || '#ccc'};"></div>`;

        let buttonHtml;
        if (isOwned) {
            buttonHtml = `<button class="buy-btn" style="background:#555; cursor:default;" disabled>Possédé</button>`;
        } else {
            buttonHtml = `<button class="buy-btn" onclick="buyItem('${item.id}', ${item.price})">${item.price} <i class="fa-solid fa-coins"></i></button>`;
        }

        itemDiv.innerHTML = `${previewHtml}<p>${item.name}</p>${buttonHtml}`;
        grid.appendChild(itemDiv);
    });
};

// B. INVENTAIRE
window.renderInventory = async function() {
    const grid = document.getElementById('inventoryGrid');
    if (!grid || !window.currentUser) return;
    if (window.shopItemsCache.length === 0) await loadShopItems();

    let ownedIds = ['skin_default', 'hand_default', 'skin_black', 'sound_default'];
    
    const { data } = await window.sbClient.from('inventory').select('item_id').eq('user_id', window.currentUser.id);
    if (data) ownedIds = [...ownedIds, ...data.map(i => i.item_id)];

    const currentSkin = window.userProfile.equipped_skin || 'skin_default';
    const currentBg = window.userProfile.equipped_bg || 'default';
    const currentHand = window.userProfile.equipped_hand || 'hand_default';
    const currentSound = window.userProfile.equipped_sound || 'sound_default';

    grid.innerHTML = '';

    // FILTRE ICI : On filtre les items possédés par le type sélectionné
    const myItems = window.shopItemsCache.filter(item => {
        const isOwned = ownedIds.includes(item.id);
        const matchesFilter = (currentInvFilter === 'all') || (item.type === currentInvFilter);
        return isOwned && matchesFilter;
    });

    if (myItems.length === 0) {
        grid.innerHTML = '<p style="grid-column: span 2; text-align:center; color:#888;">Vide...</p>';
        return;
    }

    myItems.forEach(item => {
        let isEquipped = false;
        if (item.type === 'skin' && currentSkin === item.id) isEquipped = true;
        if (item.type === 'bg' && currentBg === item.id) isEquipped = true;
        if (item.type === 'hand' && currentHand === item.id) isEquipped = true;
        if (item.type === 'sound' && currentSound === item.id) isEquipped = true;

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
    
    const { error: coinErr } = await window.sbClient.from('profiles').update({ coins: coins - price }).eq('id', window.currentUser.id);
    if (coinErr) return alert("Erreur serveur.");

    await window.sbClient.from('inventory').insert([{ user_id: window.currentUser.id, item_id: itemId }]);

    coins -= price;
    updateUI();
    renderShop(); 
    renderInventory();
};

window.equipItem = async function(itemId, type) {
    let update = {};
    if (type === 'skin') update = { equipped_skin: itemId };
    if (type === 'bg') update = { equipped_bg: itemId };
    if (type === 'hand') update = { equipped_hand: itemId };
    if (type === 'sound') update = { equipped_sound: itemId };

    const { error } = await window.sbClient.from('profiles').update(update).eq('id', window.currentUser.id);

    if (!error) {
        if (type === 'skin') window.userProfile.equipped_skin = itemId;
        if (type === 'bg') window.userProfile.equipped_bg = itemId;
        if (type === 'hand') window.userProfile.equipped_hand = itemId;
        if (type === 'sound') window.userProfile.equipped_sound = itemId;
        
        applyCosmetics();
        renderInventory(); 
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
    
    document.body.style.backgroundImage = '';
    document.body.style.backgroundColor = '#727272';

    if (bgItem && bgItem.resource_val) {
        if (bgItem.resource_val.includes('.')) {
            document.body.style.backgroundImage = `
                linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
                url('img/bg/${bgItem.resource_val}')
            `;
        } else {
            document.body.style.backgroundColor = bgItem.resource_val;
        }
    }

    // 4. SON
    const soundId = window.userProfile.equipped_sound || 'sound_default';
    const audioPlayer = document.getElementById('gameEndSound');
    const soundItem = window.shopItemsCache.find(i => i.id === soundId);
    
    if (audioPlayer) {
        if (soundItem && soundItem.resource_val) {
            audioPlayer.src = `audio/${soundItem.resource_val}`;
        } else {
            audioPlayer.src = '';
        }
    }
};

// Initialisation
window.addEventListener('load', async () => {
    loadShopItems();
    const { data } = await window.sbClient.auth.getSession();
    if (data.session) handleLoginSuccess(data.session.user);
    updateUI();
});