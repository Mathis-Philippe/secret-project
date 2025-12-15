const main = document.getElementById('main');
const displayScore = document.getElementById('scoreDisplay');
let point = 0;
let isKeyDown = false;
let isAnimationRunning = false;

addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
        if (isKeyDown) return;
            isKeyDown = true;
            if (isAnimationRunning === false) {
                isAnimationRunning = true;
                main.style.transform = "translate(-50%, calc(-50% - 150px))";
                setTimeout(() => {
                    main.style.transform = "translate(-50%, -50%)";
                }, 180);
                point++;
                displayScore.textContent = `Score : ${point}`;
            }
        isAnimationRunning = false;
                
    }
});

document.addEventListener("keyup", function(e) {
    if (e.code == 'Space') {
        isKeyDown = false;
    }
});