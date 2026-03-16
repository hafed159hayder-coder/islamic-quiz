let gameState = {
    gold: parseInt(localStorage.getItem('islamic_gold')) || 0,
    silver: parseInt(localStorage.getItem('islamic_silver')) || 0,
    // المخزون
    inventory: JSON.parse(localStorage.getItem('islamic_inv')) || { extraTime: 0, halfHalf: 0, revive: 0 },
    currentQuestions: [],
    index: 0,
    targetGold: 0,
    timeLeft: 30,
    timerActive: null
};

const sounds = {
    correct: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'),
    wrong: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3')
};

function refreshUI() {
    document.getElementById('gold-val').innerText = gameState.gold;
    document.getElementById('silver-val').innerText = gameState.silver;
    document.getElementById('count-time').innerText = gameState.inventory.extraTime;
    document.getElementById('count-half').innerText = gameState.inventory.halfHalf;
    document.getElementById('count-revive').innerText = gameState.inventory.revive;
    
    localStorage.setItem('islamic_gold', gameState.gold);
    localStorage.setItem('islamic_silver', gameState.silver);
    localStorage.setItem('islamic_inv', JSON.stringify(gameState.inventory));
}

function toggleMarket(show) {
    document.getElementById('marketplace-ui').style.display = show ? 'flex' : 'none';
    if(show) { sounds.click.play(); stopTimer(); } 
    else if(document.getElementById('quiz-screen').classList.contains('active')) { startTimer(); }
}

function buyItem(item, cost, currency) {
    if (gameState[currency] >= cost) {
        gameState[currency] -= cost;
        gameState.inventory[item]++;
        refreshUI();
        sounds.correct.play();
    } else {
        alert('رصيد غير كافٍ!');
    }
}

// استخدام الأدوات
function useExtraTime() {
    if (gameState.inventory.extraTime > 0) {
        gameState.inventory.extraTime--;
        gameState.timeLeft += 20;
        refreshUI();
        updateTimerUI();
        sounds.click.play();
    }
}

function useHalfHalf() {
    if (gameState.inventory.halfHalf > 0) {
        gameState.inventory.halfHalf--;
        const qData = gameState.currentQuestions[gameState.index];
        const items = document.querySelectorAll('.option-item');
        let hidden = 0;
        items.forEach((item, idx) => {
            if (idx !== qData.c && hidden < 2) {
                item.classList.add('hidden-opt');
                hidden++;
            }
        });
        refreshUI();
        sounds.click.play();
    }
}

function useRevive() {
    if (gameState.inventory.revive > 0) {
        gameState.inventory.revive--;
        gameState.timeLeft = 30;
        refreshUI();
        goToScreen('quiz-screen');
        displayQuestion();
        startTimer();
    }
}

// منطق اللعبة
function goToScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id !== 'quiz-screen') stopTimer();
}

function stopTimer() { clearInterval(gameState.timerActive); }

function startTimer() {
    stopTimer();
    gameState.timerActive = setInterval(() => {
        gameState.timeLeft--;
        updateTimerUI();
        if (gameState.timeLeft <= 0) { stopTimer(); handleGameOver("انتهى الوقت!"); }
    }, 1000);
}

function updateTimerUI() {
    document.getElementById('timer-bar').style.width = (gameState.timeLeft / 30 * 100) + "%";
    document.getElementById('timer-text').innerText = gameState.timeLeft;
}

function setupGame(diff, count, reward) {
    const pool = questionsDB.filter(q => q.level === diff);
    gameState.currentQuestions = pool.sort(() => 0.5 - Math.random()).slice(0, count);
    gameState.index = 0;
    gameState.targetGold = reward;
    gameState.timeLeft = 30;
    goToScreen('quiz-screen');
    displayQuestion();
    startTimer();
}

function displayQuestion() {
    const qData = gameState.currentQuestions[gameState.index];
    document.getElementById('q-counter').innerText = `${gameState.index + 1}/${gameState.currentQuestions.length}`;
    document.getElementById('progress-fill').style.width = `${(gameState.index / gameState.currentQuestions.length) * 100}%`;
    document.getElementById('question-text').innerText = qData.q;
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    qData.a.forEach((opt, i) => {
        const btn = document.createElement('div');
        btn.className = 'option-item';
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(i, qData.c);
        container.appendChild(btn);
    });
}

function handleAnswer(selected, correct) {
    stopTimer();
    const items = document.querySelectorAll('.option-item');
    if (selected === correct) {
        sounds.correct.play();
        items[selected].classList.add('correct');
        gameState.silver += 1;
        refreshUI();
        gameState.index++;
        setTimeout(() => {
            if (gameState.index < gameState.currentQuestions.length) {
                gameState.timeLeft = 30;
                displayQuestion();
                startTimer();
            } else { finishLevel(); }
        }, 600);
    } else {
        sounds.wrong.play();
        items[selected].classList.add('wrong');
        items[correct].classList.add('correct');
        setTimeout(() => handleGameOver("إجابة خاطئة!"), 800);
    }
}

function handleGameOver(msg) {
    document.getElementById('fail-message').innerText = msg;
    document.getElementById('revive-offer').style.display = gameState.inventory.revive > 0 ? 'block' : 'none';
    goToScreen('fail-screen');
}

function finishLevel() {
    gameState.gold += gameState.targetGold;
    refreshUI();
    document.getElementById('win-message').innerText = `ربحت ${gameState.targetGold} ذهب!`;
    goToScreen('win-screen');
}

window.onload = refreshUI;
