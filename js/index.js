// ===========================================================
// GESTION DES ENTRÉES (CLAVIER & TACTILE)
// ===========================================================

// Variable pour suivre le début du mode rapide
let fastModeStartTime = null; 

// --- 1. FONCTION PRINCIPALE : L'ACTION DE JEU (ESPACE / TAP) ---
// On isole cette logique pour pouvoir l'appeler via Espace OU via l'Écran tactile
function triggerGameAction() {
    // A. FERMER LES MENUS SI OUVERTS
    if (window.closeAllMenus) window.closeAllMenus();

    // Gestion du démarrage
    if (!gameStarted) {
        startTimer();
    }

    if (isAnimationRunning) return;
    isAnimationRunning = true;

    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    lastClickTime = currentTime;

    // On nettoie le timer de reset précédent
    clearTimeout(resetTimer);

    let multiplier = 1;

    // --- GESTION DES MODES (Normal, Rapide, Fire, GOD MODE) ---
    if (timeDiff < 250) { 
        // LE JOUEUR EST RAPIDE (MODE COMBO)
        if (!fastModeStartTime) {
            fastModeStartTime = Date.now();
        }

        const comboDuration = Date.now() - fastModeStartTime;

        if(ziziFast && ziziNormal) {
            ziziFast.style.opacity = "1";
            ziziNormal.style.opacity = "0";
        }

        // NIVEAU 3 : GOD MODE (x5)
        if (comboDuration > 10000 && window.activeBonuses && window.activeBonuses.hasSuperFire) {
            multiplier = 5;
            document.body.classList.add('shake-mode');
            if(ziziFast) ziziFast.classList.add('fire-mode'); 
        } 
        // NIVEAU 2 : MODE FEU (x3)
        else if (comboDuration > 5000) {
            multiplier = 3;
            document.body.classList.add('shake-mode');
            if(ziziFast) ziziFast.classList.add('fire-mode');
        } 
        // NIVEAU 1 : MODE RAPIDE (x2)
        else {
            multiplier = 2;
            document.body.classList.remove('shake-mode');
            if(ziziFast) ziziFast.classList.remove('fire-mode');
        }

        // Timer pour RESET le combo
        resetTimer = setTimeout(() => {
            resetComboState();
        }, 400);

    } else {
        // TROP LENT
        resetComboState();
    }

    // --- ANIMATION MAIN ---
    let animDuration = Math.min(Math.max(timeDiff / 2.5, 50), 400);
    if (timeDiff > 2000) animDuration = 200;

    if(main) {
        main.style.transition = `all ${animDuration}ms ease-in-out`;
        main.style.transform = "translate(-50%, calc(-50% - 150px))"; // Mouvement vers le haut
        
        setTimeout(() => {
            main.style.transform = "translate(-50%, -50%)"; // Retour
            
            // --- CALCUL DU SCORE (Au retour de la main) ---
            const bonusClick = (window.activeBonuses && window.activeBonuses.clickPower) ? window.activeBonuses.clickPower : 0;
            const pointsGained = (1 + bonusClick) * multiplier;
            
            point += pointsGained;

            // --- AFFICHAGE SCORE ---
            updateScoreVisuals(multiplier);

            setTimeout(() => {
                isAnimationRunning = false;
            }, animDuration * 0.5);
        }, animDuration);
    }
}

// Fonction utilitaire pour remettre à zéro le combo
function resetComboState() {
    if(ziziFast) ziziFast.style.opacity = "0";
    if(ziziNormal) ziziNormal.style.opacity = "1";
    fastModeStartTime = null;
    document.body.classList.remove('shake-mode');
    if(ziziFast) ziziFast.classList.remove('fire-mode');
}

// Fonction utilitaire pour mettre à jour le texte du score
function updateScoreVisuals(multiplier) {
    if(!displayScore) return;

    if (multiplier === 5) {
        displayScore.innerHTML = `Score : ${point} <br>⚡ x5 GOD MODE ⚡`;
        displayScore.style.color = "#00d2d3"; 
    } else if (multiplier === 3) {
        displayScore.innerHTML = `Score : ${point} <br>🔥 x3 SUPER COMBO 🔥`;
        displayScore.style.color = "#ffdd59"; 
    } else if (multiplier === 2) {
        displayScore.textContent = `Score : ${point} (x2!)`;
        displayScore.style.color = "#e74b4b"; 
    } else {
        displayScore.textContent = `Score : ${point}`;
        displayScore.style.color = "#ffffff";
    }
}

// --- 2. FONCTION POUR VALIDER UN MOT (PC & MOBILE) ---
function validateWordSuccess() {
    if (!window.currentWordObj) return;

    // Calcul du bonus
    let bonus = Math.floor(point / 2);
    if (bonus < 1) bonus = 1;
    
    point += bonus;
    
    // Mise à jour simple du score
    if(displayScore) displayScore.textContent = `Score : ${point}`;
    
    // Animation flottante
    showFloatingPoints(bonus); 
    
    // Nettoyage
    if(window.currentWordObj.element) window.currentWordObj.element.remove();
    window.currentWordObj = null;

    // Suivant
    if(window.scheduleNextWord) window.scheduleNextWord();
}

// ===========================================================
// LISTENERS (C'est ici qu'on gère PC vs Mobile)
// ===========================================================

// A. CLAVIER (Pour PC)
addEventListener('keydown', function (e) {
    if (isGameOver) return;

    // Ignorer si on écrit dans un input (login, etc.)
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

    // --- BARRE ESPACE ---
    if (e.code === 'Space') {
        e.preventDefault();
        if (isKeyDown) return; // Anti-triche (rester appuyé)
        isKeyDown = true;
        triggerGameAction();
    }

    // --- TYPING (LETTRES) ---
    if (window.currentWordObj && e.code !== 'Space') {
        const targetWord = window.currentWordObj.text;
        const targetIndex = window.currentWordObj.index;
        const keyPressed = e.key.toUpperCase(); 

        if (keyPressed.length === 1 && keyPressed >= 'A' && keyPressed <= 'Z') {
            if (keyPressed === targetWord[targetIndex]) {
                // Bonne lettre
                window.currentWordObj.spans[targetIndex].classList.add('letter-correct');
                window.currentWordObj.index++;

                if (window.currentWordObj.index >= targetWord.length) {
                    validateWordSuccess(); // GAGNÉ !
                }
            } else {
                // Mauvaise lettre
                if (window.currentWordObj.spans[targetIndex]) {
                    window.currentWordObj.spans[targetIndex].classList.add('letter-wrong');
                    // Petit reset visuel ou échec immédiat selon ta préférence
                    setTimeout(() => {
                         if(window.currentWordObj && window.currentWordObj.spans[targetIndex]) 
                            window.currentWordObj.spans[targetIndex].classList.remove('letter-wrong');
                    }, 200);
                }
            }
        }
    }
});

addEventListener("keyup", function (e) {
    if (e.code == 'Space') isKeyDown = false;
});


// B. TACTILE (Pour Mobile/Tablette)
// On utilise 'touchstart' pour une réaction instantanée (plus rapide que 'click')
document.addEventListener('touchstart', function(e) {
    if (isGameOver) return;

    // 1. CAS SPÉCIAL : TAPER SUR UN MOT BONUS
    // Si on touche un mot flottant, on le valide INSTANTANÉMENT (Adaptation Mobile)
    if (e.target.closest('.floating-word') || e.target.closest('.word-display')) {
        e.preventDefault();
        validateWordSuccess();
        return;
    }

    // 2. CAS D'EXCLUSION : BOUTONS & MENUS
    // On ne veut pas déclencher le jeu si on clique sur la boutique ou un bouton
    if (e.target.tagName === 'BUTTON' || e.target.closest('.side-menu') || e.target.closest('.menu-buttons') || e.target.tagName === 'INPUT') {
        return;
    }

    // 3. CAS GÉNÉRAL : TAP SUR L'ÉCRAN = ACTION DE JEU
    e.preventDefault(); // Empêche le zoom/scroll double-tap
    triggerGameAction();

}, { passive: false }); // 'passive: false' est nécessaire pour le preventDefault


// --- FONCTION ANIMATION POINTS ---
function showFloatingPoints(amount) {
    let container = document.getElementById('score-container');
    if (!container) container = document.body;

    const floatEl = document.createElement('div');
    floatEl.textContent = `+${amount}`;
    
    // Style JS de secours
    floatEl.className = 'floating-point'; 
    floatEl.style.position = 'absolute';
    floatEl.style.color = '#2ed573';
    floatEl.style.fontWeight = 'bold';
    floatEl.style.fontSize = '30px'; // Plus gros sur mobile c'est mieux
    floatEl.style.textShadow = '0 0 5px #000';
    floatEl.style.pointerEvents = 'none';
    floatEl.style.zIndex = '1000';
    
    // Position par rapport au score
    const rect = displayScore.getBoundingClientRect();
    floatEl.style.left = (rect.right + 10) + 'px'; 
    floatEl.style.top = (rect.top) + 'px';

    document.body.appendChild(floatEl);

    setTimeout(() => {
        floatEl.remove();
    }, 1500);
}