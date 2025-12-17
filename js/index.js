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

        // On nettoie le timer précédent pour éviter que le zizi repasse en normal
        clearTimeout(resetTimer);

        let multiplier = 1;

        // --- GESTION DES MODES (Normal, Rapide, Fire) ---
        
        if (timeDiff < 250) { 
            // LE JOUEUR EST RAPIDE

            // 1. Si c'est le début du mode rapide, on note l'heure
            if (!fastModeStartTime) {
                fastModeStartTime = Date.now();
            }

            // 2. On calcule la durée du combo
            const comboDuration = Date.now() - fastModeStartTime;

            // 3. Gestion Visuelle Zizi
            ziziFast.style.opacity = "1";
            ziziNormal.style.opacity = "0";

            // 4. CHECK 5 SECONDES : MODE FEU (x3)
            if (comboDuration > 5000) {
                multiplier = 3;
                
                // Active les effets visuels
                document.body.classList.add('shake-mode'); // L'écran tremble
                ziziFast.classList.add('fire-mode');       // Flammes
            } else {
                // Mode Rapide classique (x2)
                multiplier = 2;
                // On s'assure que les effets du mode feu sont éteints si on est < 5s
                document.body.classList.remove('shake-mode');
                ziziFast.classList.remove('fire-mode');
            }

            // Timer pour RESET si le joueur arrête de cliquer
            resetTimer = setTimeout(() => {
                ziziFast.style.opacity = "0";
                ziziNormal.style.opacity = "1";
                
                // On reset tout le combo
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
            point += multiplier;

            // --- AFFICHAGE SCORE ---
            if (multiplier === 3) {
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