let fastModeStartTime = null; 

addEventListener('keydown', function (e) {
    if (isGameOver) return;


    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return; 
    }

    if (window.currentWordObj && e.code !== 'Space') {
        const targetWord = window.currentWordObj.text;
        const targetIndex = window.currentWordObj.index;
        // On normalise en majuscule pour comparer
        const keyPressed = e.key.toUpperCase(); 

        // On ignore les touches systèmes (Shift, Ctrl, Alt...) qui ne sont pas des lettres
        if (keyPressed.length === 1 && keyPressed >= 'A' && keyPressed <= 'Z') {
            
            // Vérifier si la touche correspond à la lettre attendue
            if (keyPressed === targetWord[targetIndex]) {
                // --- BONNE LETTRE ---
                window.currentWordObj.spans[targetIndex].classList.add('letter-correct');
                window.currentWordObj.index++;

                // Mot terminé ?
                if (window.currentWordObj.index >= targetWord.length) {
                    // --- VICTOIRE MOT ---
                    
                    // 1. CALCUL DU BONUS (Moitié du score actuel)
                    let bonus = Math.floor(point / 2);
                    if (bonus < 1) bonus = 1; // Sécurité : au moins 1 point
                    
                    point += bonus;

                    displayScore.textContent = `Score : ${point}`;
                    
                    // 3. LANCER L'ANIMATION FLOTTANTE
                    // C'est ça qui va afficher le "+150" qui vole indépendamment
                    showFloatingPoints(bonus); 
                    
                    // Supprimer le mot
                    if(window.currentWordObj.element) window.currentWordObj.element.remove();
                    window.currentWordObj = null;

                    // Programmer le prochain mot
                    if(window.scheduleNextWord) window.scheduleNextWord();
                }

            } else {
                // --- MAUVAISE LETTRE (ECHEC) ---
                
                // Feedback visuel (Rouge sur la lettre attendue)
                if (window.currentWordObj.spans[targetIndex]) {
                    window.currentWordObj.spans[targetIndex].classList.add('letter-wrong');
                }
                
                // On supprime le mot après un très court délai pour voir l'erreur
                const wordElementToRemove = window.currentWordObj.element;
                window.currentWordObj = null; // On désactive tout de suite pour éviter le spam

                setTimeout(() => {
                    if (wordElementToRemove) wordElementToRemove.remove();
                    // Programmer le prochain mot
                    if(window.scheduleNextWord) window.scheduleNextWord();
                }, 200);
            }
        }
    }


    // --- 3. GESTION DU JEU PRINCIPAL (BARRE ESPACE) ---
    if (e.code === 'Space') {
        // A. STOPPER LE CLIC PAR DÉFAUT (sur les boutons)
        e.preventDefault(); 

        // B. FERMER LES MENUS SI OUVERTS
        if (window.closeAllMenus) window.closeAllMenus();

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

        // On nettoie le timer de reset précédent
        clearTimeout(resetTimer);

        let multiplier = 1;

        // --- C. GESTION DES MODES (Normal, Rapide, Fire, GOD MODE) ---
        
        if (timeDiff < 250) { 
            // LE JOUEUR EST RAPIDE (MODE COMBO)
            if (!fastModeStartTime) {
                fastModeStartTime = Date.now();
            }

            const comboDuration = Date.now() - fastModeStartTime;

            ziziFast.style.opacity = "1";
            ziziNormal.style.opacity = "0";

            // NIVEAU 3 : GOD MODE (x5) -> Après 10s de combo + Item "GOD MODE" équipé
            if (comboDuration > 10000 && window.activeBonuses && window.activeBonuses.hasSuperFire) {
                multiplier = 5;
                document.body.classList.add('shake-mode');
                ziziFast.classList.add('fire-mode'); 
                // Tu pourrais ajouter une classe CSS spécifique ici pour changer la couleur des flammes
            } 
            // NIVEAU 2 : MODE FEU (x3) -> Après 5s de combo
            else if (comboDuration > 5000) {
                multiplier = 3;
                document.body.classList.add('shake-mode');
                ziziFast.classList.add('fire-mode');
            } 
            // NIVEAU 1 : MODE RAPIDE (x2)
            else {
                multiplier = 2;
                document.body.classList.remove('shake-mode');
                ziziFast.classList.remove('fire-mode');
            }

            // Timer pour RESET le combo si le joueur s'arrête
            resetTimer = setTimeout(() => {
                ziziFast.style.opacity = "0";
                ziziNormal.style.opacity = "1";
                
                fastModeStartTime = null;
                document.body.classList.remove('shake-mode');
                ziziFast.classList.remove('fire-mode');
            }, 400);

        } else {
            // LE JOUEUR EST TROP LENT -> Cassure du combo
            ziziFast.style.opacity = "0";
            ziziNormal.style.opacity = "1";
            
            fastModeStartTime = null;
            document.body.classList.remove('shake-mode');
            ziziFast.classList.remove('fire-mode');
        }

        // --- D. ANIMATION MAIN ---
        let animDuration = Math.min(Math.max(timeDiff / 2.5, 50), 400);
        if (timeDiff > 2000) animDuration = 200;

        main.style.transition = `all ${animDuration}ms ease-in-out`;
        main.style.transform = "translate(-50%, calc(-50% - 150px))";

        setTimeout(() => {
            main.style.transform = "translate(-50%, -50%)";
            
            // --- E. CALCUL DU SCORE ---
            // Score = (1 base + Bonus Clic Equipé) * Multiplicateur de Vitesse
            const bonusClick = (window.activeBonuses && window.activeBonuses.clickPower) ? window.activeBonuses.clickPower : 0;
            const pointsGained = (1 + bonusClick) * multiplier;
            
            point += pointsGained;

            // --- F. AFFICHAGE SCORE ---
            if (multiplier === 5) {
                displayScore.innerHTML = `Score : ${point} <br>⚡ x5 GOD MODE ⚡`;
                displayScore.style.color = "#00d2d3"; // Cyan électrique
            } else if (multiplier === 3) {
                displayScore.innerHTML = `Score : ${point} <br>🔥 x3 SUPER COMBO 🔥`;
                displayScore.style.color = "#ffdd59"; // Jaune feu
            } else if (multiplier === 2) {
                displayScore.textContent = `Score : ${point} (x2!)`;
                displayScore.style.color = "#e74b4b"; // Rouge
            } else {
                displayScore.textContent = `Score : ${point}`;
                displayScore.style.color = "#ffffff";
            }

            setTimeout(() => {
                isAnimationRunning = false;
            }, animDuration * 0.5);
        }, animDuration);
    }
});

document.addEventListener("keyup", function (e) {
    if (e.code == 'Space') {
        isKeyDown = false;
    }
});

function showFloatingPoints(amount) {
    // On vérifie si le conteneur existe, sinon on le crée ou on utilise le body
    let container = document.getElementById('score-container');
    if (!container) container = document.body; // Fallback si tu n'as pas créé de conteneur spécifique

    const floatEl = document.createElement('div');
    floatEl.textContent = `+${amount}`;
    
    // On applique le style directement ici ou via la classe CSS 'floating-point'
    // Je te mets le style JS ici au cas où tu n'as pas mis le CSS
    floatEl.style.position = 'absolute';
    floatEl.style.color = '#2ed573'; // Vert néon
    floatEl.style.fontWeight = 'bold';
    floatEl.style.fontSize = '24px';
    floatEl.style.textShadow = '0 0 5px #000';
    floatEl.style.pointerEvents = 'none';
    floatEl.style.zIndex = '1000';
    
    // Positionner près du score (ajuste ces valeurs selon ton écran)
    // Idéalement, positionne-le par rapport à displayScore
    const rect = displayScore.getBoundingClientRect();
    floatEl.style.left = (rect.right + 10) + 'px'; 
    floatEl.style.top = rect.top + 'px';
    
    // Animation CSS via classe (Recommandé si tu as mis le CSS précédent)
    floatEl.className = 'floating-point'; 

    document.body.appendChild(floatEl);

    // Suppression automatique
    setTimeout(() => {
        floatEl.remove();
    }, 1500);
}