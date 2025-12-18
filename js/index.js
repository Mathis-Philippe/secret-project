// On écoute juste le clavier ici. 
// Les variables (main, point, etc.) viennent de script.js

// NOUVEAU : Variable pour suivre le début du mode rapide
let fastModeStartTime = null; 

addEventListener('keydown', function (e) {
    if (isGameOver) return;

    if (e.code === 'Space') {
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

        // On nettoie le timer précédent
        clearTimeout(resetTimer);

        let multiplier = 1;

        // --- GESTION DES MODES (Normal, Rapide, Fire, SUPER FIRE) ---
        
        if (timeDiff < 250) { 
            // LE JOUEUR EST RAPIDE
            if (!fastModeStartTime) {
                fastModeStartTime = Date.now();
            }

            const comboDuration = Date.now() - fastModeStartTime;

            ziziFast.style.opacity = "1";
            ziziNormal.style.opacity = "0";

            // 5. NOUVEAU : CHECK 10 SECONDES + ITEM SPÉCIAL (x5)
            if (comboDuration > 10000 && window.activeBonuses && window.activeBonuses.hasSuperFire) {
                multiplier = 5;
                document.body.classList.add('shake-mode');
                ziziFast.classList.add('fire-mode'); 
                // Optionnel : ajouter une classe spéciale CSS pour changer la couleur du feu
            } 
            // 4. CHECK 5 SECONDES : MODE FEU (x3)
            else if (comboDuration > 5000) {
                multiplier = 3;
                document.body.classList.add('shake-mode');
                ziziFast.classList.add('fire-mode');
            } else {
                multiplier = 2;
                document.body.classList.remove('shake-mode');
                ziziFast.classList.remove('fire-mode');
            }

            // Timer pour RESET si le joueur arrête de cliquer
            resetTimer = setTimeout(() => {
                ziziFast.style.opacity = "0";
                ziziNormal.style.opacity = "1";
                
                fastModeStartTime = null;
                document.body.classList.remove('shake-mode');
                ziziFast.classList.remove('fire-mode');
            }, 400);

        } else {
            // LE JOUEUR EST TROP LENT (Cassure du combo)
            ziziFast.style.opacity = "0";
            ziziNormal.style.opacity = "1";
            
            fastModeStartTime = null;
            document.body.classList.remove('shake-mode');
            ziziFast.classList.remove('fire-mode');
        }

        // --- ANIMATION MAIN ---
        let animDuration = Math.min(Math.max(timeDiff / 2.5, 50), 400);
        if (timeDiff > 2000) animDuration = 200;

        main.style.transition = `all ${animDuration}ms ease-in-out`;
        main.style.transform = "translate(-50%, calc(-50% - 150px))";

        setTimeout(() => {
            main.style.transform = "translate(-50%, -50%)";
            
            // CALCUL DU SCORE AVEC BONUS
            const bonusClick = (window.activeBonuses && window.activeBonuses.clickPower) ? window.activeBonuses.clickPower : 0;
            const pointsGained = (1 + bonusClick) * multiplier;
            
            point += pointsGained;

            // --- AFFICHAGE SCORE ---
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