const displayArea = document.getElementById('displayArea');
const typingInput = document.getElementById('typingInput');
const newSnippetBtn = document.getElementById('newSnippetBtn');
const selectLevel = document.getElementById('selectLevel');
const selectLanguage = document.getElementById('selectLanguage');
const copyBtn = document.getElementById('copyBtn');
const progressEl = document.getElementById('progress');
const wpmEl = document.getElementById('wpm');
const accuracyEl = document.getElementById('accuracy');
const soundToggle = document.getElementById('soundToggle');
const timerEl = document.getElementById('timer');

let currentSnippet = '';
let startTime = null;
let soundEnabled = true;
let testDuration = 30;
let timeLeft = 30;
let timerInterval = null;
let timerStarted = false;
let isTyping = false;

async function loadSnippet() {
  timerEl.style.background = "";
  const lang = selectLanguage.value.toLowerCase();
  const level = selectLevel.value.toLowerCase();
  const fileName = `${lang}-snippets.json`;

  if (level === 'beginner') testDuration = 15;
  else if (level === 'intermediate') testDuration = 30;
  else if (level === 'advanced') testDuration = 50;

  try {
    const res = await fetch(`../snippets/${fileName}`);
    const data = await res.json();
    const filtered = data.snippets.filter(s => s.level === level);

    if (!filtered.length) {
      displayArea.innerHTML = '⚠ No snippet found.';
      return;
    }

    const snippet = filtered[Math.floor(Math.random() * filtered.length)];
    currentSnippet = snippet.code;

    typingInput.value = '';
    displayHighlighted('');
    resetStats();

    startTime = null;
    isTyping = false;
    timerStarted = false;
    clearInterval(timerInterval);
    timerEl.textContent = `⏱ ${testDuration}s left`;

    typingInput.removeAttribute('disabled');
  } catch (e) {
    displayArea.innerHTML = '❌ Failed to load snippet.';
    console.error(e);
  }
}

function startTimer() {
  timeLeft = testDuration;
  timerEl.textContent = `⏱ ${timeLeft}s left`;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `⏱ ${timeLeft}s left`;
    if (timeLeft <= 0) {
      timerEl.textContent = "Time Over ⏳";
      clearInterval(timerInterval);
      typingInput.disabled = true;
      showFinalStats();
    }
  }, 1000);
}


function showFinalStats() {
  const typed = typingInput.value;
  const totalTyped = typed.length;
  const correctChars = [...typed].filter((char, idx) => char === currentSnippet[idx]).length;
  const minutes = testDuration / 60;
  const wpm = Math.round((totalTyped / 5) / minutes);
  const accuracy = totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 0;

  wpmEl.textContent = wpm;
  accuracyEl.textContent = `${accuracy}%`;
}
function displayHighlighted(userInput) {
  let html = '';
  for (let i = 0; i < currentSnippet.length; i++) {
    const expected = currentSnippet[i];
    const typed = userInput[i];

    if (expected === '\n') {
      html += '<br>';
      continue;
    }



    if (typed == null) {
      html += `<span>${expected}</span>`;
    } else if (typed === expected) {
      html += `<span class="green">${expected}</span>`;
    } else {
      html += `<span class="red">${expected}</span>`;
    }
  }
  displayArea.innerHTML = html;
}


function playKeySound() {
  if (!soundEnabled) return;
  new Audio('click.mp3').play();
}

typingInput.addEventListener('input', () => {
  const input = typingInput.value;
  timerEl.style.background = "red";
  if (!timerStarted) {
    startTimer();
    startTime = Date.now();
    timerStarted = true;
  }

  if (input.length > currentSnippet.length) {
    typingInput.value = input.slice(0, currentSnippet.length);
    return;
  }

  let fixedInput = '';
  for (let i = 0; i < input.length; i++) {
    const expectedChar = currentSnippet[i];
    const typedChar = input[i];

    if (expectedChar === '\n' && typedChar !== '\n') {
      typingInput.value = fixedInput;
      break;
    }
    fixedInput += typedChar;
  }

  userInput = typingInput.value;

  displayHighlighted(userInput);
  playKeySound();

  const correct = [...userInput].filter((c, i) => c === currentSnippet[i]).length;
  const progress = Math.floor((userInput.length / currentSnippet.length) * 100);
  const accuracy = userInput.length ? Math.floor((correct / userInput.length) * 100) : 0;
  const timeMin = ((Date.now() - startTime) / 1000) / 60;
  const wpm = Math.round((userInput.trim().split(/\s+/).length / timeMin) || 0);

  progressEl.textContent = `${Math.min(progress, 100)}%`;
  accuracyEl.textContent = `${accuracy}%`;
  wpmEl.textContent = isFinite(wpm) ? wpm : 0;

  if (userInput.length >= currentSnippet.length) {
    typingInput.disabled = true;
    clearInterval(timerInterval);
    showFinalStats();
  }
});


newSnippetBtn.addEventListener('click', () => {
  typingInput.disabled = false;
  loadSnippet();
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(currentSnippet).then(() => {
    alert('Snippet copied!');
  });
});

soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = soundEnabled ? '🔊 Sound' : '🔇 Muted';
});

setInterval(() => {
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();

  document.getElementById('clock').innerHTML = `
    <div style="font-size: 0.9rem;">📅 ${date}</div>
    <div style="font-size: 1.1rem;">⏰ ${time}</div>
  `;
}, 1000);


function resetStats() {
  progressEl.textContent = "0%";
  accuracyEl.textContent = "0%";
  wpmEl.textContent = "0";
  timerEl.textContent = `⏱ ${testDuration}s left`;
}

loadSnippet();
