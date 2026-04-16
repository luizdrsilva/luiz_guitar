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
const generateScaleBtn = document.getElementById("generate-scale");
const scaleTitle = document.getElementById("scale-title");
const scaleNotes = document.getElementById("scale-notes");
const chordsContainer = document.getElementById("chords-container");
const sequenceBox = document.getElementById("sequence-box");
const clearSequenceBtn = document.getElementById("clear-sequence");
const removeLastChordBtn = document.getElementById("remove-last-chord");

const audioFileInput = document.getElementById("audio-file");
const audioName = document.getElementById("audio-name");
const originalAudio = document.getElementById("original-audio");

const youtubeLinkInput = document.getElementById("youtube-link");
const loadYoutubeBtn = document.getElementById("load-youtube");
const clearYoutubeBtn = document.getElementById("clear-youtube");
const youtubeStatus = document.getElementById("youtube-status");

const noteNames = [
  "C",
  "C# / Db",
  "D",
  "D# / Eb",
  "E",
  "F",
  "F# / Gb",
  "G",
  "G# / Ab",
  "A",
  "A# / Bb",
  "B"
];

const romanNumeralsMajor = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const romanNumeralsMinor = ["i", "ii°", "III", "iv", "v", "VI", "VII"];

const majorSteps = [0, 2, 4, 5, 7, 9, 11];
const minorSteps = [0, 2, 3, 5, 7, 8, 10];

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

function onYouTubeIframeAPIReady() {
  youtubeApiReady = true;
  youtubeStatus.textContent = "API do YouTube pronta. Cole um link para abrir o player.";
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

moduleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;
    const targetCard = document.getElementById(targetId);

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

  if (newBpm < 60 || newBpm > 150) {
    return;
  }

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
  let shuffled = shuffleArray(noteNames);

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
  const filteredNotes = noteNames.filter((note) => note !== excludedNote);
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

function normalizeNoteName(note) {
  return note.split(" / ")[0];
}

function buildScale(rootNote, mode) {
  const rootIndex = noteNames.indexOf(rootNote);
  const steps = mode === "major" ? majorSteps : minorSteps;

  return steps.map((step) => {
    const noteIndex = (rootIndex + step) % noteNames.length;
    return noteNames[noteIndex];
  });
}

function buildChordList(scale, mode) {
  const romanNumerals = mode === "major" ? romanNumeralsMajor : romanNumeralsMinor;

  return scale.map((note, index) => {
    const normalized = normalizeNoteName(note);
    let chordName = normalized;

    if (mode === "major") {
      if (index === 1 || index === 2 || index === 5) chordName += "m";
      if (index === 6) chordName += "dim";
    } else {
      if (index === 0 || index === 3 || index === 4) chordName += "m";
      if (index === 1) chordName += "dim";
    }

    return {
      degree: romanNumerals[index],
      chord: chordName
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
  const scale = buildScale(selectedKey, selectedMode);
  const chords = buildChordList(scale, selectedMode);

  const modeLabel = selectedMode === "major" ? "maior" : "menor";
  renderScale(scale, `Escala de ${selectedKey} ${modeLabel}`);
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