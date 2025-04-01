




const categories = {
    nature: {
        name: "🌿 الطبيعة",
        image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        words: ["شمس", "ضوء", "قمر", "ليل", "نجوم", "سماء", "مطر", "بحر"],
        difficulties: {
            easy: ["شمس", "ضوء", "قمر", "ليل"],
            medium: ["نجوم", "سماء", "مطر", "بحر"],
            hard: ["برق", "رعد", "غيوم", "ندى"]
        }
    },
    food: {
        name: "🍕 الطعام",
        image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        words: ["تفاح", "برتقال", "موز", "عنب", "فراولة", "خبز", "جبن", "شوكولاتة"],
        difficulties: {
            easy: ["تفاح", "برتقال", "موز", "عنب"],
            medium: ["فراولة", "خبز", "جبن", "شوكولاتة"],
            hard: ["معكرونة", "بيتزا", "همبرغر", "سوشي"]
        }
    },
    science: {
        name: "🔬 العلوم",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        words: ["ذرة", "كيمياء", "فيزياء", "مجهر", "خلية", "طاقة", "كوكب", "جاذبية"],
        difficulties: {
            easy: ["ذرة", "كيمياء", "فيزياء", "مجهر"],
            medium: ["خلية", "طاقة", "كوكب", "جاذبية"],
            hard: ["نسبية", "كم", "ثقب أسود", "حمض نووي"]
        }
    }
};

// عند تحميل الصفحة، ضع الصور في العناصر
window.onload = function() {
    document.getElementById('nature-img').src = categories.nature.image;
    document.getElementById('food-img').src = categories.food.image;
    document.getElementById('science-img').src = categories.science.image;
};


// متغيرات اللعبة
let playerName = "";
let isHost = false;
let currentRoomCode = "";
let currentCategory = "";
let currentDifficulty = "";
let words = [];
let currentStep = 1;
let currentTeam = "A";
let teamNames = { A: "فريق A", B: "فريق B" };
let scores = { A: 0, B: 0 };
let guessedWords = { A: [], B: [] };
let timer;
const timeLimit = 30;
let players = {};
let currentPlayerIndex = { A: 0, B: 0 };
let teamPlayers = { A: [], B: [] };

// وظائف الصفحات
function submitPlayerName() {
    playerName = document.getElementById("player-name").value.trim();
    if (playerName === "") {
        alert("الرجاء إدخال اسمك");
        return;
    }
    
    document.getElementById("display-player-name").textContent = playerName;
    switchPage("player-name-page", "game-options-page");
}

function showCreateGame() {
    switchPage("game-options-page", "create-game-page");
}

function showJoinGame() {
    switchPage("game-options-page", "join-game-page");
}

function backToOptions() {
    switchPage("create-game-page", "game-options-page");
}

function backToCategories() {
    switchPage("difficulty-page", "create-game-page");
}

function selectCategory(category) {
    currentCategory = category;
    switchPage("create-game-page", "difficulty-page");
}

async function createRoom() {
  const roomRef = await db.collection("rooms").add({
    category: currentCategory,
    difficulty: currentDifficulty,
    host: playerName,
    players: {},
    teamNames: { A: "فريق A", B: "فريق B" },
    words: words,
  });
  currentRoomCode = roomRef.id; // استخدم ID المستند كرمز الغرفة
}

function selectDifficulty(difficulty) {
    currentDifficulty = difficulty;
    words = categories[currentCategory].difficulties[difficulty];
    
    // إنشاء غرفة جديدة
    isHost = true;
    currentRoomCode = generateRoomCode();
    document.getElementById("room-code-display").textContent = currentRoomCode;
    document.getElementById("room-link-display").textContent = window.location.href + "?join=" + currentRoomCode;
    document.getElementById("host-name").textContent = playerName;
    
    // إضافة اللاعب المضيف
    players = {};
    teamPlayers = { A: [], B: [] };
    players[playerName] = { team: null };
    updatePlayersList();
    
    switchPage("difficulty-page", "waiting-room");
}
function submitPlayerName() {
    playerName = document.getElementById("player-name").value.trim();
    if (playerName === "") {
        // تأثير اهتزاز إذا كان الحقل فارغاً
        const inputField = document.getElementById("player-name");
        inputField.style.animation = "shake 0.5s";
        inputField.focus();
        
        // إزالة التأثير بعد انتهائه
        setTimeout(() => {
            inputField.style.animation = "";
        }, 500);
        
        return;
    }
    
    document.getElementById("display-player-name").textContent = playerName;
    switchPage("player-name-page", "game-options-page");
}
function joinRoom() {
    const roomCode = document.getElementById("room-code-input").value.trim();
    if (roomCode === "") {
        alert("الرجاء إدخال رمز الغرفة");
        return;
    }
    
    currentRoomCode = roomCode;
    isHost = false;
    
    // إضافة اللاعب
    players = {};
    teamPlayers = { A: [], B: [] };
    players[playerName] = { team: null };
    updatePlayersList();
    
    document.getElementById("start-game-btn").classList.add("hidden");
    switchPage("join-game-page", "waiting-room");
}

function joinTeam(team) {
    if (!players[playerName]) return;
    
    // إزالة اللاعب من الفريق السابق إذا كان موجوداً
    for (const t in teamPlayers) {
        teamPlayers[t] = teamPlayers[t].filter(p => p !== playerName);
    }
    
    players[playerName].team = team;
    teamPlayers[team].push(playerName);
    updatePlayersList();
    
    // إذا كان المضيف، قم بتحديث أسماء الفرق
    if (isHost) {
        teamNames[team] = prompt(`أدخل اسم ${team === 'A' ? 'الفريق الأول' : 'الفريق الثاني'}`, teamNames[team]) || teamNames[team];
        document.getElementById(`teamA-title-waiting`).textContent = teamNames.A;
        document.getElementById(`teamB-title-waiting`).textContent = teamNames.B;
    }
}

function startGame() {
    if (!isHost) return;
     // تحديث حالة حقل الإدخال
     const guessInput = document.getElementById("guess-input");
     guessInput.readOnly = true;
     guessInput.placeholder = "انتظر بدء اللعبة...";
     guessInput.style.cursor = "not-allowed";
     
    if (!words || words.length === 0) {
        alert("حدث خطأ في تحميل الكلمات، يرجى المحاولة مرة أخرى");
        return;
    }
    
    // إعادة تعيين حالة اللعبة
    currentStep = 1;
    scores = { A: 0, B: 0 };
    guessedWords = { A: [], B: [] };
    currentTeam = "A";
    currentPlayerIndex = { A: 0, B: 0 };
    
    switchPage("waiting-room", "game-container");
    
    // تحديث واجهة اللعبة
    document.getElementById("teamA-title").textContent = teamNames.A;
    document.getElementById("teamB-title").textContent = teamNames.B;
    document.getElementById("scoreA").textContent = "0";
    document.getElementById("scoreB").textContent = "0";
    document.getElementById("teamA-words").innerHTML = "";
    document.getElementById("teamB-words").innerHTML = "";
    
    // تحديث قوائم اللاعبين في واجهة اللعبة
    updateTeamPlayersDisplay();
    
    displayWordChain();
    startTimer();
    updateCurrentPlayer();
}

function leaveRoom() {
    switchPage("waiting-room", "game-options-page");
}

// وظائف اللعبة الأساسية
function displayWordChain() {
    if (!words || words.length === 0) return;
    
    let chainHTML = `<div class="word big-word">${words[0]}</div>`;

    for (let i = 1; i < words.length; i++) {
        if (i < currentStep) {
            chainHTML += `<div class="word">${words[i]}</div>`;
        } else if (i === currentStep) {
            chainHTML += `<div class="word current-word">${formatHiddenWord(words[i])}</div>`;
        } else {
            chainHTML += `<div class="word hidden-word">${'_ '.repeat(words[i].length).trim()}</div>`;
        }
    }

    document.getElementById("word-chain").innerHTML = chainHTML;
}

function formatHiddenWord(word) {
    return word[0] + ' ' + '_ '.repeat(word.length - 1).trim();
}

function submitGuess() {
    const currentPlayer = teamPlayers[currentTeam][currentPlayerIndex[currentTeam]];
    if (playerName !== currentPlayer) {
        showMessage("ليس دورك الآن!", "red");
        return;
    }

    const guessInput = document.getElementById("guess-input");
    const guess = guessInput.value.trim();

    if (!guess) {
        showMessage("الرجاء إدخال كلمة", "red");
        return;
    }

    if (guess === words[currentStep]) {
        showMessage("✅ إجابة صحيحة!", "green");
        scores[currentTeam]++;
        guessedWords[currentTeam].push(guess);
        
        updateScoreboard();
        updateTeamWords();
        currentStep++;

        if (currentStep === words.length) {
            declareWinner();
            return;
        }

        clearInterval(timer);
        startTimer();
    } else {
        showMessage("❌ إجابة خاطئة!", "red");
    }

    guessInput.value = "";
    switchTeam();
    displayWordChain();
}

function showMessage(text, color) {
    const messageBox = document.getElementById("message-box");
    messageBox.textContent = text;
    messageBox.style.color = "white";
    messageBox.style.backgroundColor = color;
    messageBox.style.padding = "10px";
    messageBox.style.borderRadius = "5px";
    messageBox.style.marginTop = "10px";
}

function switchTeam() {
    // تحديث مؤشر اللاعب الحالي للفريق الحالي
    const currentTeamPlayers = teamPlayers[currentTeam];
    if (currentTeamPlayers.length > 0) {
        currentPlayerIndex[currentTeam] = (currentPlayerIndex[currentTeam] + 1) % currentTeamPlayers.length;
    }
    
    // التبديل إلى الفريق الآخر
    currentTeam = currentTeam === "A" ? "B" : "A";
    
    clearInterval(timer);
    startTimer();
    updateCurrentPlayer();
}

function updateCurrentPlayer() {
    const team = currentTeam;
    if (teamPlayers[team].length === 0) return;
    
    const currentPlayer = teamPlayers[team][currentPlayerIndex[team]];
    showMessage(`دور ${teamNames[team]} - اللاعب ${currentPlayer} الآن`, "blue");
    
    // تحديث عرض اللاعب الحالي
    updateTeamPlayersDisplay();
    
    // التحكم في حقل الإدخال حسب اللاعب الحالي
    const guessInput = document.getElementById("guess-input");
    if (players[playerName] && players[playerName].team === team && currentPlayer === playerName) {
        guessInput.readOnly = false;
        guessInput.placeholder = "أدخل الكلمة التالية...";
        guessInput.focus();
        guessInput.style.cursor = "text";
    } else {
        guessInput.readOnly = true;
        guessInput.placeholder = `انتظر دور ${currentPlayer}...`;
        guessInput.style.cursor = "not-allowed";
    }
}

function updateScoreboard() {
    document.getElementById("scoreA").textContent = scores.A;
    document.getElementById("scoreB").textContent = scores.B;
}

function updateTeamWords() {
    document.getElementById("teamA-words").innerHTML = guessedWords.A.map(word => `<div class="word">${word}</div>`).join("");
    document.getElementById("teamB-words").innerHTML = guessedWords.B.map(word => `<div class="word">${word}</div>`).join("");
}

function updateTeamPlayersDisplay() {
    const teamAElements = document.getElementById("teamA-players");
    const teamBElements = document.getElementById("teamB-players");
    
    teamAElements.innerHTML = "";
    teamBElements.innerHTML = "";
    
    // تحديث عرض اللاعبين مع تمييز اللاعب الحالي
    for (const team in teamPlayers) {
        const currentPlayer = teamPlayers[team][currentPlayerIndex[team]];
        
        teamPlayers[team].forEach((player, index) => {
            const playerElement = document.createElement("div");
            playerElement.className = "player" + (player === currentPlayer && team === currentTeam ? " current-player" : "");
            playerElement.textContent = player;
            
            if (team === "A") {
                teamAElements.appendChild(playerElement);
            } else {
                teamBElements.appendChild(playerElement);
            }
        });
    }
}

function declareWinner() {
    let winner = scores.A > scores.B ? teamNames.A : teamNames.B;
    let winnerScore = Math.max(scores.A, scores.B);
    
    document.getElementById("message-box").innerHTML = `
        <div style="background-color: #4CAF50; color: white; padding: 15px; border-radius: 10px;">
            🎉 <b>الفريق الفائز هو: ${winner} بـ ${winnerScore} نقطة!</b>
        </div>
    `;
    clearInterval(timer);
    
 // تعطيل حقل الإدخال بعد انتهاء اللعبة
 const guessInput = document.getElementById("guess-input");
 guessInput.readOnly = true;
 guessInput.placeholder = "انتهت اللعبة";
 guessInput.style.cursor = "not-allowed";
}

function startTimer() {
    clearInterval(timer);
    let timeLeft = timeLimit;
    updateTimerDisplay(timeLeft);
    
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            showMessage("انتهى الوقت!", "red");
            switchTeam();
        }
    }, 1000);
}

function updateTimerDisplay(timeLeft) {
    const timerElement = document.getElementById("timer-display");
    if (timerElement) {
        timerElement.textContent = `الوقت المتبقي: ${timeLeft} ثانية`;
        timerElement.style.color = timeLeft <= 10 ? "red" : "white";
    }
}

// وظائف مساعدة
function switchPage(fromId, toId) {
    document.getElementById(fromId).classList.add("hidden");
    document.getElementById(toId).classList.remove("hidden");
}

function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function updatePlayersList() {
    const playersList = document.getElementById("players-list");
    const teamAMembers = document.getElementById("teamA-members");
    const teamBMembers = document.getElementById("teamB-members");
    
    playersList.innerHTML = "";
    teamAMembers.innerHTML = "";
    teamBMembers.innerHTML = "";
    
    // إضافة المضيف أولاً
    if (isHost) {
        const hostElement = document.createElement("div");
        hostElement.className = "player";
        hostElement.textContent = playerName + " (أنت - المضيف)";
        playersList.appendChild(hostElement);
    }
    
    // إضافة بقية اللاعبين
    for (const [name, data] of Object.entries(players)) {
        if (name !== playerName || !isHost) {
            const playerElement = document.createElement("div");
            playerElement.className = "player";
            playerElement.textContent = name + (data.team ? ` (فريق ${data.team})` : "");
            playersList.appendChild(playerElement);
        }
        
        if (data.team === "A") {
            const memberElement = document.createElement("div");
            memberElement.className = "team-member";
            memberElement.textContent = name;
            teamAMembers.appendChild(memberElement);
        } else if (data.team === "B") {
            const memberElement = document.createElement("div");
            memberElement.className = "team-member";
            memberElement.textContent = name;
            teamBMembers.appendChild(memberElement);
        }
    }
    
    // تحديث قوائم اللاعبين في الفريقين
    teamPlayers.A = [];
    teamPlayers.B = [];
    for (const [name, data] of Object.entries(players)) {
        if (data.team === "A") teamPlayers.A.push(name);
        if (data.team === "B") teamPlayers.B.push(name);
    }
}
