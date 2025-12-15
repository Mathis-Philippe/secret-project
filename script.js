const main = document.getElementById('main');
const ziziNormal = document.getElementById('ziziNormal');
const ziziFast = document.getElementById('ziziFast');
const displayScore = document.getElementById('scoreDisplay');
let point = 0;
let isKeyDown = false;
let isAnimationRunning = false;
let lastClickTime = Date.now();
let resetTimer;

addEventListener('click', function(e) {
    if (e.code === 'click') {

        if (isKeyDown) return;
            isKeyDown = true;

            if (isAnimationRunning) return;
                isAnimationRunning = true;
                const currentTime = Date.now();
                const timeDiff = currentTime - lastClickTime;
                lastClickTime = currentTime;

                clearTimeout(resetTimer);
                if (timeDiff < 150) {
                    ziziNormal.style.display = "none";
                    ziziFast.style.display = "block";
                    resetTimer = setTimeout(() => {
                        ziziNormal.style.display = "block";
                        ziziFast.style.display = "none";
                    }, 400);
                } else {
                    ziziNormal.style.display = "block";
                    ziziFast.style.display = "none";
                }

                let animDuration = Math.min(Math.max(timeDiff / 2.5, 50), 400);
                if (timeDiff > 2000) animDuration = 200;
                    main.style.transition = `all ${animDuration}ms ease-in-out`;
                    main.style.transform = "translate(-50%, calc(-50% - 150px))";
                    setTimeout(() => {
                        main.style.transform = "translate(-50%, -50%)";
                        point++;
                        displayScore.textContent = `Score : ${point}`;
                    setTimeout(() => {
                        isAnimationRunning = false; 
                    }, animDuration);
                }, animDuration);
                
    }
});

addEventListener('keydown', function(e) {
    if (e.code === 'Space') {

        if (isKeyDown) return;
            isKeyDown = true;

            if (isAnimationRunning) return;
                isAnimationRunning = true;
                const currentTime = Date.now();
                const timeDiff = currentTime - lastClickTime;
                lastClickTime = currentTime;

                clearTimeout(resetTimer);
                if (timeDiff < 150) {
                    ziziNormal.style.display = "none";
                    ziziFast.style.display = "block";
                    resetTimer = setTimeout(() => {
                        ziziNormal.style.display = "block";
                        ziziFast.style.display = "none";
                    }, 400);
                } else {
                    ziziNormal.style.display = "block";
                    ziziFast.style.display = "none";
                }

                let animDuration = Math.min(Math.max(timeDiff / 2.5, 50), 400);
                if (timeDiff > 2000) animDuration = 200;
                    main.style.transition = `all ${animDuration}ms ease-in-out`;
                    main.style.transform = "translate(-50%, calc(-50% - 150px))";
                    setTimeout(() => {
                        main.style.transform = "translate(-50%, -50%)";
                        point++;
                        displayScore.textContent = `Score : ${point}`;
                    setTimeout(() => {
                        isAnimationRunning = false; 
                    }, animDuration);
                }, animDuration);
                
    }
});

document.addEventListener("keyup", function(e) {
    if (e.code == 'Space') {
        isKeyDown = false;
    }
});