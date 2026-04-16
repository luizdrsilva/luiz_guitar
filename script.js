const moduleButtons = document.querySelectorAll(".modulo-btn");

const bpmValue = document.getElementById("bpm-value");
const bpmDisplay = document.getElementById("bpm-display");
const toggleMetronomeBtn = document.getElementById("toggle-metronome");
const increaseBtn = document.getElementById("increase-bpm");
const decreaseBtn = document.getElementById("decrease-bpm");

const beatDots = [
  document.getElementById("beat-0"),
  document.getElementById("beat-1"),
  document.getElementById("beat-2"),
  document.getElementById("beat-3")
];

const generateNoteBtn = document.getElementById("generate-note");
const randomNote = document.getElementById("random-note");
const noteStatus = document.getElementById("note-status");
const tipMajor = document.getElementById("tip-major");
const tipMinor = document.getElementById("tip-minor");
const tipPenta = document.getElementById("tip-penta");

const keySelect = document.getElementById("key-select");
const modeSelect = document.getElementById("mode-select");
const chordTypeSelect = document.getElementById("chord-type-select");
const generateScaleBtn = document.getElementById("generate-scale");
const scaleTitle = document.getElementById("scale-title");
const chordTitle = document.getElementById("chord-title");
const scaleNotes = document.getElementById("scale-notes");
const chordsContainer = document.getElementById("chords-container");
const sequenceBox = document.getElementById("sequence-box");
const clearSequenceBtn = document.getElementById("clear-sequence");
const removeLastChordBtn = document.getElementById("remove-last-chord");

const todoInput = document.getElementById("todo-input");
const addTodoBtn = document.getElementById("add-todo");
const clearDoneTodosBtn = document.getElementById("clear-done-todos");
const clearAllTodosBtn = document.getElementById("clear-all-todos");
const todoList = document.getElementById("todo-list");
const todoTotal = document.getElementById("todo-total");
const todoDone = document.getElementById("todo-done");
const todoPending = document.getElementById("todo-pending");

const audioFileInput = document.getElementById("audio-file");
const audioName = document.getElementById("audio-name");
const originalAudio = document.getElementById("original-audio");

const youtubeLinkInput = document.getElementById("youtube-link");
const loadYoutubeBtn = document.getElementById("load-youtube");
const clearYoutubeBtn = document.getElementById("clear-youtube");
const youtubeStatus = document.getElementById("youtube-status");

const STORAGE_KEY = "groove_guitar_todos";

const randomNotePool = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F",
  "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"
];

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PITCH = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

const MODE_DATA = {
  major: {
    label: "maior",
    steps: [0, 2, 4, 5, 7, 9, 11],
    romans: ["I", "ii", "iii", "IV", "V", "vi", "vii°"],
    triads: ["maj", "min", "min", "maj", "maj", "min", "dim"],
    tetrads: ["maj7", "m7", "m7", "maj7", "7", "m7", "m7b5"]
  },
  minor: {
    label: "menor",
    steps: [0, 2, 3, 5, 7, 8, 10],
    romans: ["i", "ii°", "III", "iv", "v", "VI", "VII"],
    triads: ["min", "dim", "maj", "min", "min", "maj", "maj"],
    tetrads: ["m7", "m7b5", "maj7", "m7", "m7", "maj7", "7"]
  }
};

let bpm = 60;
let isPlaying = false;
let metronomeInterval = null;
let audioContext = null;
let currentBeat = 0;
let noteBag = [];
let lastFinalNote = null;
let currentSequence = [];
let youtubePlayer = null;
let youtubeApiReady = false;
let todos = [];

function onYouTubeIframeAPIReady() {
  youtubeApiReady = true;
  youtubeStatus.textContent = "API do YouTube pronta. Cole um link para abrir o player.";
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

moduleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;
    const targetCard = document.getElementById(targetId);

    if (!targetCard) return;

    button.classList.toggle("active");
    targetCard.classList.toggle("hidden-module");
  });
});

function updateBpmDisplay() {
  bpmValue.textContent = bpm;
  bpmDisplay.textContent = bpm;

  decreaseBtn.disabled = bpm <= 60;
  increaseBtn.disabled = bpm >= 150;
}

function clearBeatLights() {
  beatDots.forEach((dot) => {
    dot.classList.remove("active-main", "active-secondary");
  });
}

function flashBeat(beatIndex) {
  clearBeatLights();

  if (beatIndex === 0) {
    beatDots[beatIndex].classList.add("active-main");
  } else {
    beatDots[beatIndex].classList.add("active-secondary");
  }
}

function playClick(isStrongBeat) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = isStrongBeat ? 1400 : 900;

    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      isStrongBeat ? 0.35 : 0.18,
      audioContext.currentTime + 0.01
    );
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.07);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch (error) {
    console.error("Erro ao tocar clique do metrônomo:", error);
  }
}

function runBeat() {
  const isStrongBeat = currentBeat === 0;
  playClick(isStrongBeat);
  flashBeat(currentBeat);
  currentBeat = (currentBeat + 1) % 4;
}

function startMetronome() {
  const interval = 60000 / bpm;
  currentBeat = 0;
  runBeat();

  metronomeInterval = setInterval(() => {
    runBeat();
  }, interval);

  isPlaying = true;
  toggleMetronomeBtn.textContent = "Parar metrônomo";
}

function stopMetronome() {
  clearInterval(metronomeInterval);
  metronomeInterval = null;
  isPlaying = false;
  toggleMetronomeBtn.textContent = "Iniciar metrônomo";
  currentBeat = 0;
  clearBeatLights();
}

function restartMetronomeIfNeeded() {
  if (isPlaying) {
    stopMetronome();
    startMetronome();
  }
}

function changeBpm(amount) {
  const newBpm = bpm + amount;

  if (newBpm < 60 || newBpm > 150) return;

  bpm = newBpm;
  updateBpmDisplay();
  restartMetronomeIfNeeded();
}

toggleMetronomeBtn.addEventListener("click", () => {
  if (isPlaying) {
    stopMetronome();
  } else {
    startMetronome();
  }
});

increaseBtn.addEventListener("click", () => changeBpm(5));
decreaseBtn.addEventListener("click", () => changeBpm(-5));

function updateTips(note) {
  tipMajor.textContent = `Improvisar em ${note} maior`;
  tipMinor.textContent = `Improvisar em ${note} menor`;
  tipPenta.textContent = `Pentatônica de ${note}`;
}

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }

  return copy;
}

function refillNoteBag() {
  let shuffled = shuffleArray(randomNotePool);

  if (lastFinalNote && shuffled[0] === lastFinalNote && shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  noteBag = shuffled;
}

function getNextNote() {
  if (noteBag.length === 0) {
    refillNoteBag();
  }

  const nextNote = noteBag.shift();
  lastFinalNote = nextNote;
  return nextNote;
}

function getAnimationNote(excludedNote) {
  const filteredNotes = randomNotePool.filter((note) => note !== excludedNote);
  const randomIndex = Math.floor(Math.random() * filteredNotes.length);
  return filteredNotes[randomIndex];
}

function generateRandomNote() {
  const finalNote = getNextNote();
  let count = 0;

  noteStatus.textContent = "Sorteando...";
  generateNoteBtn.disabled = true;

  const animationInterval = setInterval(() => {
    const tempNote = getAnimationNote(finalNote);

    randomNote.textContent = tempNote;
    randomNote.classList.add("animating");

    setTimeout(() => {
      randomNote.classList.remove("animating");
    }, 80);

    count++;

    if (count >= 10) {
      clearInterval(animationInterval);

      randomNote.textContent = finalNote;
      randomNote.classList.add("animating");

      setTimeout(() => {
        randomNote.classList.remove("animating");
      }, 150);

      updateTips(finalNote);
      noteStatus.textContent = "Pronta";
      generateNoteBtn.disabled = false;
    }
  }, 85);
}

generateNoteBtn.addEventListener("click", generateRandomNote);

function parseRoot(root) {
  const letter = root[0].toUpperCase();
  const accidental = root.slice(1);
  let pitch = NATURAL_PITCH[letter];

  if (accidental === "#") pitch += 1;
  if (accidental === "b") pitch -= 1;

  return {
    letter,
    pitch: ((pitch % 12) + 12) % 12
  };
}

function accidentalFromDiff(diff) {
  const normalized = ((diff % 12) + 12) % 12;

  if (normalized === 0) return "";
  if (normalized === 1) return "#";
  if (normalized === 2) return "##";
  if (normalized === 11) return "b";
  if (normalized === 10) return "bb";

  return "";
}

function buildScale(root, mode) {
  const modeInfo = MODE_DATA[mode];
  const parsedRoot = parseRoot(root);
  const startLetterIndex = LETTERS.indexOf(parsedRoot.letter);

  return modeInfo.steps.map((step, index) => {
    const targetPitch = (parsedRoot.pitch + step) % 12;
    const letter = LETTERS[(startLetterIndex + index) % LETTERS.length];
    const naturalPitch = NATURAL_PITCH[letter];
    const diff = targetPitch - naturalPitch;
    const accidental = accidentalFromDiff(diff);
    return `${letter}${accidental}`;
  });
}

function applyChordQuality(note, quality) {
  if (quality === "maj") return note;
  if (quality === "min") return `${note}m`;
  if (quality === "dim") return `${note}dim`;

  if (quality === "maj7") return `${note}maj7`;
  if (quality === "m7") return `${note}m7`;
  if (quality === "7") return `${note}7`;
  if (quality === "m7b5") return `${note}m7(b5)`;

  return note;
}

function buildChordList(scale, mode, chordType) {
  const modeInfo = MODE_DATA[mode];
  const qualities = chordType === "tetrads" ? modeInfo.tetrads : modeInfo.triads;

  return scale.map((note, index) => {
    return {
      degree: modeInfo.romans[index],
      chord: applyChordQuality(note, qualities[index])
    };
  });
}

function renderScale(scale, titleText) {
  scaleTitle.textContent = titleText;
  scaleNotes.innerHTML = "";

  scale.forEach((note) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = note;
    scaleNotes.appendChild(tag);
  });
}

function updateSequenceBox() {
  if (currentSequence.length === 0) {
    sequenceBox.classList.add("vazio");
    sequenceBox.textContent = "Clique nos acordes para montar sua progressão";
    return;
  }

  sequenceBox.classList.remove("vazio");
  sequenceBox.textContent = currentSequence.join(" | ");
}

function renderChords(chords) {
  chordsContainer.innerHTML = "";

  chords.forEach((item) => {
    const button = document.createElement("button");
    button.className = "chord-btn";
    button.type = "button";
    button.textContent = `${item.degree} — ${item.chord}`;

    button.addEventListener("click", () => {
      currentSequence.push(item.chord);
      updateSequenceBox();
    });

    chordsContainer.appendChild(button);
  });
}

function generateScaleAndChords() {
  const selectedKey = keySelect.value;
  const selectedMode = modeSelect.value;
  const selectedChordType = chordTypeSelect.value;

  const scale = buildScale(selectedKey, selectedMode);
  const chords = buildChordList(scale, selectedMode, selectedChordType);

  const modeLabel = MODE_DATA[selectedMode].label;
  const chordTypeLabel = selectedChordType === "tetrads" ? "Tétrades" : "Tríades";

  renderScale(scale, `Escala de ${selectedKey} ${modeLabel}`);
  chordTitle.textContent = `Campo Harmônico em ${chordTypeLabel}`;
  renderChords(chords);
}

generateScaleBtn.addEventListener("click", generateScaleAndChords);

clearSequenceBtn.addEventListener("click", () => {
  currentSequence = [];
  updateSequenceBox();
});

removeLastChordBtn.addEventListener("click", () => {
  currentSequence.pop();
  updateSequenceBox();
});

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    todos = [];
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    todos = Array.isArray(parsed) ? parsed : [];
  } catch {
    todos = [];
  }
}

function updateTodoSummary() {
  const total = todos.length;
  const done = todos.filter((todo) => todo.done).length;
  const pending = total - done;

  todoTotal.textContent = total;
  todoDone.textContent = done;
  todoPending.textContent = pending;
}

function renderTodos() {
  todoList.innerHTML = "";

  if (todos.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "todo-empty";
    emptyItem.textContent = "Nenhuma tarefa adicionada ainda.";
    todoList.appendChild(emptyItem);
    updateTodoSummary();
    return;
  }

  const sortedTodos = [...todos].sort((a, b) => {
    if (a.done === b.done) return 0;
    return a.done ? 1 : -1;
  });

  sortedTodos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = `todo-item ${todo.done ? "done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-check";
    checkbox.checked = todo.done;

    checkbox.addEventListener("change", () => {
      const originalTodo = todos.find((itemTodo) => itemTodo.id === todo.id);
      if (originalTodo) {
        originalTodo.done = checkbox.checked;
      }
      saveTodos();
      renderTodos();
    });

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const removeBtn = document.createElement("button");
    removeBtn.className = "todo-remove";
    removeBtn.type = "button";
    removeBtn.textContent = "Excluir";

    removeBtn.addEventListener("click", () => {
      todos = todos.filter((itemTodo) => itemTodo.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    item.appendChild(checkbox);
    item.appendChild(text);
    item.appendChild(removeBtn);

    todoList.appendChild(item);
  });

  updateTodoSummary();
}

function addTodo() {
  const text = todoInput.value.trim();

  if (!text) return;

  todos.push({
    id: Date.now() + Math.random(),
    text,
    done: false
  });

  todoInput.value = "";
  saveTodos();
  renderTodos();
}

addTodoBtn.addEventListener("click", addTodo);

todoInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addTodo();
  }
});

clearDoneTodosBtn.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.done);
  saveTodos();
  renderTodos();
});

clearAllTodosBtn.addEventListener("click", () => {
  todos = [];
  saveTodos();
  renderTodos();
});

audioFileInput.addEventListener("change", () => {
  const file = audioFileInput.files[0];

  if (!file) return;

  const url = URL.createObjectURL(file);
  originalAudio.src = url;
  audioName.textContent = file.name;
});

function extractYouTubeVideoId(url) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.slice(1);
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");
      if (videoId) return videoId;

      const pathParts = parsedUrl.pathname.split("/");
      const embedIndex = pathParts.indexOf("embed");
      if (embedIndex !== -1 && pathParts[embedIndex + 1]) {
        return pathParts[embedIndex + 1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

function loadYouTubeVideo(videoId) {
  if (!youtubeApiReady) {
    youtubeStatus.textContent = "A API do YouTube ainda está carregando.";
    return;
  }

  if (!youtubePlayer) {
    youtubePlayer = new YT.Player("youtube-player", {
      height: "315",
      width: "560",
      videoId,
      playerVars: {
        playsinline: 1
      }
    });
  } else {
    youtubePlayer.loadVideoById(videoId);
  }

  youtubeStatus.textContent = "Vídeo carregado no player.";
}

loadYoutubeBtn.addEventListener("click", () => {
  const link = youtubeLinkInput.value.trim();

  if (!link) {
    youtubeStatus.textContent = "Cole um link do YouTube primeiro.";
    return;
  }

  const videoId = extractYouTubeVideoId(link);

  if (!videoId) {
    youtubeStatus.textContent = "Não consegui identificar um vídeo válido nesse link.";
    return;
  }

  loadYouTubeVideo(videoId);
});

clearYoutubeBtn.addEventListener("click", () => {
  youtubeLinkInput.value = "";

  if (youtubePlayer && typeof youtubePlayer.stopVideo === "function") {
    youtubePlayer.stopVideo();
  }

  const playerContainer = document.getElementById("youtube-player");
  playerContainer.innerHTML = "";
  youtubePlayer = null;
  youtubeStatus.textContent = "Player limpo. Cole um novo link para abrir outro vídeo.";
});

updateBpmDisplay();
updateTips("C");
refillNoteBag();
generateScaleAndChords();
updateSequenceBox();
loadTodos();
renderTodos();