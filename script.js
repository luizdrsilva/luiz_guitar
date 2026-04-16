// METRONOMO
let bpm = 60;
let interval;
let beat = 0;
let playing = false;

const bpmDisplay = document.getElementById("bpm");
const dots = [0,1,2,3].map(i => document.getElementById("b"+i));

function updateBPM() {
  bpmDisplay.innerText = bpm;
}

function playClick(strong) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.frequency.value = strong ? 1400 : 900;
  gain.gain.value = 0.2;

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
}

function tick() {
  dots.forEach(d => d.classList.remove("active-main","active"));

  if (beat === 0) {
    dots[beat].classList.add("active-main");
  } else {
    dots[beat].classList.add("active");
  }

  playClick(beat === 0);

  beat = (beat + 1) % 4;
}

function start() {
  interval = setInterval(tick, 60000 / bpm);
  playing = true;
}

function stop() {
  clearInterval(interval);
  playing = false;
}

document.getElementById("increase").onclick = () => {
  if (bpm < 120) bpm += 5;
  updateBPM();
};

document.getElementById("decrease").onclick = () => {
  if (bpm > 60) bpm -= 5;
  updateBPM();
};

document.getElementById("toggleMetronome").onclick = () => {
  if (playing) stop();
  else start();
};

updateBPM();


// NOTAS
const notes = [
"C","C# / Db","D","D# / Eb","E","F",
"F# / Gb","G","G# / Ab","A","A# / Bb","B"
];

document.getElementById("generate").onclick = () => {
  const note = notes[Math.floor(Math.random() * notes.length)];
  document.getElementById("note").innerText = note;
};


// PLAYER + SEPARAÇÃO
const fileInput = document.getElementById("file");
const original = document.getElementById("original");
const vocal = document.getElementById("vocal");
const inst = document.getElementById("inst");

let ctx = new AudioContext();

fileInput.onchange = async () => {
  const file = fileInput.files[0];
  const url = URL.createObjectURL(file);
  original.src = url;
};

document.getElementById("process").onclick = async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Escolha um áudio");

  const buffer = await file.arrayBuffer();
  const audio = await ctx.decodeAudioData(buffer);

  const L = audio.getChannelData(0);
  const R = audio.getChannelData(1);

  const vocalBuffer = ctx.createBuffer(1, audio.length, audio.sampleRate);
  const instBuffer = ctx.createBuffer(1, audio.length, audio.sampleRate);

  const v = vocalBuffer.getChannelData(0);
  const i = instBuffer.getChannelData(0);

  for (let n = 0; n < audio.length; n++) {
    v[n] = (L[n] + R[n]) / 2;
    i[n] = (L[n] - R[n]) / 2;
  }

  vocal.src = toURL(vocalBuffer);
  inst.src = toURL(instBuffer);
};

function toURL(buffer) {
  const wav = encode(buffer);
  return URL.createObjectURL(new Blob([wav]));
}

function encode(buffer) {
  const data = buffer.getChannelData(0);
  const buf = new ArrayBuffer(44 + data.length * 2);
  const view = new DataView(buf);

  function write(s, o) {
    for (let i=0;i<s.length;i++) view.setUint8(o+i,s.charCodeAt(i));
  }

  write("RIFF",0);
  view.setUint32(4,36 + data.length*2,true);
  write("WAVE",8);
  write("fmt ",12);
  view.setUint32(16,16,true);
  view.setUint16(20,1,true);
  view.setUint16(22,1,true);
  view.setUint32(24,44100,true);
  view.setUint32(28,44100*2,true);
  view.setUint16(32,2,true);
  view.setUint16(34,16,true);
  write("data",36);
  view.setUint32(40,data.length*2,true);

  let offset = 44;
  for (let i=0;i<data.length;i++) {
    view.setInt16(offset, data[i]*0x7fff, true);
    offset+=2;
  }

  return view;
}