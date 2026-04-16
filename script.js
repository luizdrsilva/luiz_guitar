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

const notes = [
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

let bpm = 60;
let isPlaying = false;
let metronomeInterval = null;
let audioContext = null;
let currentBeat = 0;
let noteBag = [];
let lastFinalNote = null;

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

increaseBtn.addEventListener("click", () => {
  changeBpm(5);
});

decreaseBtn.addEventListener("click", () => {
  changeBpm(-5);
});

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
  let shuffled = shuffleArray(notes);

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
  const filteredNotes = notes.filter((note) => note !== excludedNote);
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

updateBpmDisplay();
updateTips("C");
refillNoteBag();