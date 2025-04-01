// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyBbrNlAVg2k3P1t19kBw8zawe_HaustQcA",
  authDomain: "hibida-game.firebaseapp.com",
  projectId: "hibida-game",
  storageBucket: "hibida-game.appspot.com",
  messagingSenderId: "6531720128",
  appId: "1:6531720128:web:f511392c45ff8fc39f5e25",
  measurementId: "G-KTXCWQXG1X"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Game variables
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

// Categories data
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

// On window load
window.onload = function() {
  document.getElementById('nature-img').src = categories.nature.image;
  document.getElementById('food-img').src = categories.food.image;
  document.getElementById('science-img').src = categories.science.image;
  
  // Check for room code in URL
  const urlParams = new URLSearchParams(window.location.search);
  const joinCode = urlParams.get('join');
  if (joinCode) {
    document.getElementById("room-code-input").value = joinCode;
  }
};

// Page navigation functions
function submitPlayerName() {
  playerName = document.getElementById("player-name").value.trim();
  if (playerName === "") {
    const inputField = document.getElementById("player-name");
    inputField.style.animation = "shake 0.5s";
    inputField.focus();
    setTimeout(() => { inputField.style.animation = ""; }, 500);
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

// Game creation and joining
async function selectDifficulty(difficulty) {
  currentDifficulty = difficulty;
  words = categories[currentCategory].difficulties[difficulty];
  
  isHost = true;
  await createRoom();
  
  document.getElementById("room-code-display").textContent = currentRoomCode;
  document.getElementById("room-link-display").textContent = window.location.href.split('?')[0] + "?join=" + currentRoomCode;
  document.getElementById("host-name").textContent = playerName;
  
  switchPage("difficulty-page", "waiting-room");
}

async function createRoom() {
  const roomRef = await db.collection("rooms").add({
    category: currentCategory,
    difficulty: currentDifficulty,
    host: playerName,
    players: { [playerName]: true },
    teamNames: { A: "فريق A", B: "فريق B" },
    words: words,
    currentStep: 1,
    scores: { A: 0, B: 0 },
    guessedWords: { A: [], B: [] },
    currentTeam: "A",
    teamPlayers: { A: [playerName], B: [] }
  });
  
  currentRoomCode = roomRef.id;
  listenToRoomChanges();
}

async function joinRoom() {
  const roomCode = document.getElementById("room-code-input").value.trim();
  if (roomCode === "") {
    alert("الرجاء إدخال رمز الغرفة");
    return;
  }
  
  currentRoomCode = roomCode;
  isHost = false;
  
  const roomRef = db.collection("rooms").doc(roomCode);
  const docSnap = await roomRef.get();
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    words = data.words;
    currentCategory = data.category;
    currentDifficulty = data.difficulty;
    teamNames = data.teamNames;
    
    await roomRef.update({
      [`players.${playerName}`]: true
    });
    
    document.getElementById("start-game-btn").classList.add("hidden");
    switchPage("join-game-page", "waiting-room");
    listenToRoomChanges();
  } else {
    alert("لا توجد غرفة بهذا الرمز!");
  }
}

function listenToRoomChanges() {
  const roomRef = db.collection("rooms").doc(currentRoomCode);
  
  roomRef.onSnapshot((doc) => {
    if (doc.exists) {
      const data = doc.data();
      
      // Update game state
      players = data.players;
      currentStep = data.currentStep;
      scores = data.scores;
      guessedWords = data.guessedWords;
      currentTeam = data.currentTeam;
      teamPlayers = data.teamPlayers;
      teamNames = data.teamNames;
      
      // Update UI
      updatePlayersList();
      updateScoreboard();
      updateTeamWords();
      updateTeamPlayersDisplay();
      
      if (document.getElementById("waiting-room").classList.contains("hidden")) {
        displayWordChain();
        updateCurrentPlayer();
      }
      
      // Auto-start game if host started it
      if (data.gameStarted && document.getElementById("waiting-room").classList.contains("hidden") === false) {
        startGame();
      }
    }
  });
}

// Team management
async function joinTeam(team) {
  if (!players[playerName]) return;
  
  const roomRef = db.collection("rooms").doc(currentRoomCode);
  
  // Remove player from previous team if any
  for (const t in teamPlayers) {
    if (teamPlayers[t].includes(playerName)) {
      await roomRef.update({
        [`teamPlayers.${t}`]: firebase.firestore.FieldValue.arrayRemove(playerName)
      });
    }
  }
  
  // Add player to new team
  await roomRef.update({
    [`teamPlayers.${team}`]: firebase.firestore.FieldValue.arrayUnion(playerName),
    [`players.${playerName}`]: team
  });
  
  // Update team name if host
  if (isHost) {
    const newName = prompt(`أدخل اسم ${team === 'A' ? 'الفريق الأول' : 'الفريق الثاني'}`, teamNames[team]) || teamNames[team];
    if (newName !== teamNames[team]) {
      await roomRef.update({
        [`teamNames.${team}`]: newName
      });
    }
  }
}

// Game functions
async function startGame() {
  if (!isHost) return;
  
  const roomRef = db.collection("rooms").doc(currentRoomCode);
  await roomRef.update({
    gameStarted: true,
    currentStep: 1,
    scores: { A: 0, B: 0 },
    guessedWords: { A: [], B: [] },
    currentTeam: "A"
  });
  
  switchPage("waiting-room", "game-container");
  
  // Update UI
  document.getElementById("teamA-title").textContent = teamNames.A;
  document.getElementById("teamB-title").textContent = teamNames.B;
  document.getElementById("scoreA").textContent = "0";
  document.getElementById("scoreB").textContent = "0";
  document.getElementById("teamA-words").innerHTML = "";
  document.getElementById("teamB-words").innerHTML = "";
  
  displayWordChain();
  startTimer();
  updateCurrentPlayer();
}

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

async function submitGuess() {
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

  const roomRef = db.collection("rooms").doc(currentRoomCode);
  
  if (guess === words[currentStep]) {
    showMessage("✅ إجابة صحيحة!", "green");
    
    // Update game state in Firestore
    await roomRef.update({
      [`scores.${currentTeam}`]: scores[currentTeam] + 1,
      [`guessedWords.${currentTeam}`]: [...guessedWords[currentTeam], guess],
      currentStep: currentStep + 1,
      currentTeam: currentTeam === "A" ? "B" : "A"
    });

    if (currentStep + 1 === words.length) {
      declareWinner();
      return;
    }

    clearInterval(timer);
    startTimer();
  } else {
    showMessage("❌ إجابة خاطئة!", "red");
    await roomRef.update({
      currentTeam: currentTeam === "A" ? "B" : "A"
    });
  }

  guessInput.value = "";
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

function updateCurrentPlayer() {
  const team = currentTeam;
  if (teamPlayers[team].length === 0) return;
  
  const currentPlayer = teamPlayers[team][currentPlayerIndex[team]];
  showMessage(`دور ${teamNames[team]} - اللاعب ${currentPlayer} الآن`, "blue");
  
  updateTeamPlayersDisplay();
  
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

function switchTeam() {
  const roomRef = db.collection("rooms").doc(currentRoomCode);
  
  // Update current player index for the current team
  const currentTeamPlayers = teamPlayers[currentTeam];
  if (currentTeamPlayers.length > 0) {
    currentPlayerIndex[currentTeam] = (currentPlayerIndex[currentTeam] + 1) % currentTeamPlayers.length;
  }
  
  // Switch to the other team
  const newTeam = currentTeam === "A" ? "B" : "A";
  
  roomRef.update({
    currentTeam: newTeam
  });
  
  clearInterval(timer);
  startTimer();
}

function updatePlayersList() {
  const playersList = document.getElementById("players-list");
  const teamAMembers = document.getElementById("teamA-members");
  const teamBMembers = document.getElementById("teamB-members");
  
  playersList.innerHTML = "";
  teamAMembers.innerHTML = "";
  teamBMembers.innerHTML = "";
  
  // Add host first
  if (isHost) {
    const hostElement = document.createElement("div");
    hostElement.className = "player";
    hostElement.textContent = playerName + " (أنت - المضيف)";
    playersList.appendChild(hostElement);
  }
  
  // Add other players
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
}

function switchPage(fromId, toId) {
  document.getElementById(fromId).classList.add("hidden");
  document.getElementById(toId).classList.remove("hidden");
}

function leaveRoom() {
  if (currentRoomCode) {
    const roomRef = db.collection("rooms").doc(currentRoomCode);
    roomRef.update({
      [`players.${playerName}`]: firebase.firestore.FieldValue.delete()
    });
  }
  switchPage("waiting-room", "game-options-page");
}
