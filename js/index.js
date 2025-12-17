// On écoute juste le clavier ici. 
// Les variables (main, point, etc.) viennent de script.js

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

        // --- ZIZI ROUGE ---
        clearTimeout(resetTimer);
        let multiplier = 1;
        if (timeDiff < 250) { // J'ai mis 250ms pour tester, tu peux remettre 170
            ziziFast.style.opacity = "1";
            ziziNormal.style.opacity = "0";
            multiplier = 2;

            resetTimer = setTimeout(() => {
                ziziFast.style.opacity = "0";
                ziziNormal.style.opacity = "1";
            }, 400);
        } else {
            ziziFast.style.opacity = "0";
            ziziNormal.style.opacity = "1";
        }

        // --- ANIMATION MAIN ---
        let animDuration = Math.min(Math.max(timeDiff / 2.5, 50), 400);
        if (timeDiff > 2000) animDuration = 200;

        main.style.transition = `all ${animDuration}ms ease-in-out`;
        main.style.transform = "translate(-50%, calc(-50% - 150px))";

        setTimeout(() => {
            main.style.transform = "translate(-50%, -50%)";
            point += multiplier;

            if (multiplier === 2) {
                displayScore.textContent = `Score : ${point} (x2!)`;
                displayScore.style.color = "#e74b4b";
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