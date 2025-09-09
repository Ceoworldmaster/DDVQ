/*
  The Path to Liberation — Prototype Engine
  Language: HTML5/CSS/JS
  Focus: Narrative, respectful tone, educational exploration
*/

// Audio assets (placeholder)
const audio = {
  ambiencePort: new Audio(),
};
audio.ambiencePort.loop = true;
audio.ambiencePort.volume = 0.35;

// DOM refs
const dom = {
  background: document.getElementById('background'),
  hotspots: document.getElementById('hotspots'),
  chapterIndicator: document.getElementById('chapter-indicator'),
  understandingValue: document.getElementById('understanding-value'),
  dialogueLayer: document.getElementById('dialogue-layer'),
  dialogueBox: document.getElementById('dialogue-box'),
  dialogueCharacter: document.getElementById('dialogue-character'),
  dialogueText: document.getElementById('dialogue-text'),
  dialogueChoices: document.getElementById('dialogue-choices'),
  dialogueContinue: document.getElementById('dialogue-continue'),
  journalToggle: document.getElementById('journal-toggle'),
  journalPanel: document.getElementById('journal-panel'),
  journalClose: document.getElementById('journal-close'),
  journalEntries: document.getElementById('journal-entries'),
  documentModal: document.getElementById('document-modal'),
  documentTitle: document.getElementById('document-title'),
  documentBody: document.getElementById('document-body'),
  documentClose: document.getElementById('document-close'),
  chapterTransition: document.getElementById('chapter-transition'),
};

/** Game state and content definitions */
const gameState = {
  currentChapter: 1,
  currentScene: 'saigon_port_1911',
  understandingLevel: 0,
  inventory: [],
  journal: [],
  flags: {
    spokeWithOldSailor: false,
    readShipManifest: false,
    sailorGaveInsight: false,
    chapter1Complete: false,
  },
};

/** Utility */
function clearElement(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function tweenFade(el, show) {
  el.classList.remove('fade-in', 'fade-out');
  if (show) {
    el.classList.add('fade-in');
    el.classList.remove('hidden');
  } else {
    el.classList.add('fade-out');
    setTimeout(() => el.classList.add('hidden'), 300);
  }
}

/** Journal system */
const Journal = {
  addEntry(entry) {
    gameState.journal.push(entry);
    Journal.render();
  },
  render() {
    clearElement(dom.journalEntries);
    gameState.journal.forEach((e) => {
      const div = document.createElement('div');
      div.className = 'entry';
      const h = document.createElement('h4');
      h.textContent = `Chapter ${e.chapter} — ${e.title}`;
      const p = document.createElement('p');
      p.textContent = e.text;
      div.appendChild(h);
      div.appendChild(p);
      dom.journalEntries.appendChild(div);
    });
  },
  toggle(show) {
    if (show === undefined) show = dom.journalPanel.classList.contains('hidden');
    if (show) {
      dom.journalPanel.classList.remove('hidden');
      dom.journalPanel.setAttribute('aria-hidden', 'false');
      dom.journalToggle.setAttribute('aria-expanded', 'true');
    } else {
      dom.journalPanel.classList.add('hidden');
      dom.journalPanel.setAttribute('aria-hidden', 'true');
      dom.journalToggle.setAttribute('aria-expanded', 'false');
    }
  },
};

/** Dialogue system */
let activeDialogue = null;

function showDialogue(character, linesOrText, choices) {
  dom.dialogueCharacter.textContent = character || '';
  dom.dialogueText.textContent = '';
  clearElement(dom.dialogueChoices);
  dom.dialogueContinue.classList.add('hidden');

  const lines = Array.isArray(linesOrText) ? linesOrText.slice() : [String(linesOrText)];
  activeDialogue = { character, lines, choices };
  dom.dialogueLayer.classList.remove('hidden');
  renderDialogueStep();
}

function renderDialogueStep() {
  if (!activeDialogue) return;
  const { lines, choices } = activeDialogue;
  if (lines.length > 0) {
    const line = lines.shift();
    dom.dialogueText.classList.remove('fade-in');
    // force reflow to restart animation
    void dom.dialogueText.offsetWidth;
    dom.dialogueText.textContent = line;
    dom.dialogueText.classList.add('fade-in');
    dom.dialogueContinue.classList.remove('hidden');
    clearElement(dom.dialogueChoices);
  } else {
    dom.dialogueContinue.classList.add('hidden');
    if (choices && choices.length) {
      choices.forEach((c) => {
        if (c.minUnderstanding !== undefined && gameState.understandingLevel < c.minUnderstanding) return;
        const btn = document.createElement('button');
        btn.textContent = c.label;
        btn.addEventListener('click', () => {
          hideDialogue();
          c.onSelect && c.onSelect();
        });
        dom.dialogueChoices.appendChild(btn);
      });
    } else {
      // No choices; clicking the box closes
      dom.dialogueLayer.addEventListener('click', hideDialogueOnce);
    }
  }
}

function hideDialogueOnce() {
  dom.dialogueLayer.removeEventListener('click', hideDialogueOnce);
  hideDialogue();
}

function hideDialogue() {
  dom.dialogueLayer.classList.add('hidden');
  activeDialogue = null;
}

dom.dialogueContinue.addEventListener('click', renderDialogueStep);

/** Understanding mechanics */
function increaseUnderstanding(amount = 1, note) {
  gameState.understandingLevel += amount;
  dom.understandingValue.textContent = String(gameState.understandingLevel);
  if (note) {
    Journal.addEntry({
      chapter: gameState.currentChapter,
      title: 'A Deeper Understanding',
      text: note,
    });
  }
}

/** Document modal */
function showDocument(title, text) {
  dom.documentTitle.textContent = title;
  dom.documentBody.textContent = text;
  dom.documentModal.classList.remove('hidden');
  dom.documentModal.setAttribute('aria-hidden', 'false');
}
function hideDocument() {
  dom.documentModal.classList.add('hidden');
  dom.documentModal.setAttribute('aria-hidden', 'true');
}

dom.documentClose.addEventListener('click', hideDocument);

/** Scenes and hotspots */
const scenes = {
  saigon_port_1911: {
    title: 'Saigon Port, 1911',
    placeholder: 'Saigon Port, 1911',
    ambience: 'port',
    hotspots: [
      {
        id: 'old_sailor',
        label: 'Old Sailor',
        rect: { left: '15%', top: '55%', width: '14%', height: '12%' },
        onClick: () => talkOldSailor(),
      },
      {
        id: 'ship_manifest',
        label: 'Ship Manifest',
        rect: { left: '62%', top: '62%', width: '16%', height: '10%' },
        onClick: () => readShipManifest(),
      },
    ],
  },
  ship_deck: {
    title: 'Aboard the Amiral Latouche-Tréville',
    placeholder: 'Ship Deck — 1911',
    ambience: 'ocean',
    hotspots: [],
  },
};

function setAmbience(name) {
  try {
    if (name === 'port') {
      // 1 second of silence as placeholder source; replaceable by user with real audio.
      audio.ambiencePort.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAABAAAA';
      audio.ambiencePort.play().catch(() => {});
    } else {
      audio.ambiencePort.pause();
    }
  } catch (e) {
    // ignore
  }
}

function showScene(sceneId) {
  const scene = scenes[sceneId];
  if (!scene) return;
  gameState.currentScene = sceneId;
  dom.chapterIndicator.textContent = `Chapter ${gameState.currentChapter}: ${gameState.currentChapter === 1 ? 'The Departure' : scene.title}`;

  // Background placeholder art label
  clearElement(dom.background);
  const ph = document.createElement('div');
  ph.className = 'placeholder-art';
  ph.textContent = scene.placeholder;
  dom.background.appendChild(ph);
  dom.background.classList.remove('fade-in');
  void dom.background.offsetWidth;
  dom.background.classList.add('fade-in');

  // Hotspots
  clearElement(dom.hotspots);
  scene.hotspots.forEach((h) => {
    const div = document.createElement('div');
    div.className = 'hotspot';
    div.style.left = h.rect.left;
    div.style.top = h.rect.top;
    if (h.rect.width) div.style.width = h.rect.width;
    if (h.rect.height) div.style.height = h.rect.height;
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = h.label;
    div.appendChild(label);
    div.addEventListener('click', h.onClick);
    dom.hotspots.appendChild(div);
  });

  setAmbience(scene.ambience);
}

/** Chapter flow */
function maybeCompleteChapter1() {
  if (gameState.flags.spokeWithOldSailor && gameState.flags.readShipManifest && !gameState.flags.chapter1Complete) {
    gameState.flags.chapter1Complete = true;
    Journal.addEntry({
      chapter: 1,
      title: 'Departure',
      text: 'With papers in hand and questions burning within, the journey begins.',
    });
    transitionToChapter2();
  }
}

function transitionToChapter2() {
  tweenFade(dom.chapterTransition, true);
  setTimeout(() => {
    tweenFade(dom.chapterTransition, false);
    gameState.currentChapter = 2;
    showScene('ship_deck');
  }, 1400);
}

/** Interactions */
function talkOldSailor() {
  const intro = [
    'The sea takes many and returns few answers, boy.',
    'But answers don\'t come to those who wait on the shore.',
  ];

  const choices = [
    {
      label: 'I seek a path to free my homeland. What have you seen?',
      onSelect: () => {
        const lines = [
          'In ports from Dakar to Marseille, workers bend under the same sun.',
          'Some whisper that knowledge travels faster than ships, carried in ideas and print.',
        ];
        showDialogue('Old Sailor', lines, [
          {
            label: 'Ideas and print… perhaps the press is a compass.',
            onSelect: () => {
              gameState.flags.spokeWithOldSailor = true;
              gameState.flags.sailorGaveInsight = true;
              increaseUnderstanding(1, 'Hearing of shared struggles across seas deepens resolve.');
              Journal.addEntry({
                chapter: 1,
                title: 'Words That Travel',
                text: 'The sailor speaks of distant ports and the weight of labor. Change spreads with ideas.',
              });
              maybeCompleteChapter1();
            },
          },
          {
            label: 'Thank you. I will remember your words.',
            onSelect: () => {
              gameState.flags.spokeWithOldSailor = true;
              Journal.addEntry({
                chapter: 1,
                title: 'A Quiet Counsel',
                text: 'Respect and gratitude offered to one who has seen many shores.',
              });
              maybeCompleteChapter1();
            },
          },
          {
            label: 'Oppression is not only ours to bear, is it?',
            minUnderstanding: 1,
            onSelect: () => {
              const further = [
                'Not only yours. But each shore names it different. Learn their names; you\'ll know its shape.',
              ];
              showDialogue('Old Sailor', further, [
                {
                  label: 'Then I must learn to read the world, not just its maps.',
                  onSelect: () => {
                    gameState.flags.spokeWithOldSailor = true;
                    increaseUnderstanding(1, 'Understanding grows: solidarity connects distant struggles.');
                    maybeCompleteChapter1();
                  },
                },
              ]);
            },
          },
        ]);
      },
    },
    {
      label: 'Are you from this ship? Do you know its route?',
      onSelect: () => {
        const lines = [
          'The manifest knows the route. Paper remembers what men forget.',
          'Find it near the gangway. Read not only the ports, but the currents beneath them.',
        ];
        showDialogue('Old Sailor', lines);
        gameState.flags.spokeWithOldSailor = true;
        Journal.addEntry({
          chapter: 1,
          title: 'On Paper and Paths',
          text: 'The Old Sailor points to the manifest: a map of places and possibilities.',
        });
        maybeCompleteChapter1();
      },
    },
  ];

  showDialogue('Old Sailor', intro, choices);
}

function readShipManifest() {
  const title = 'Ship Manifest — Amiral Latouche-Tréville (Excerpt)';
  const text = [
    'Departure: Saigon, 1911',
    'Ports of Call: Singapore, Colombo, Aden, Suez, Port Said, Marseille',
    'Note: Crew changes expected in Marseille; cargo includes machinery, textiles, and mail.',
    '',
    'The lines list more than cargo. They list crossings: oceans, languages, and lives.',
  ].join('\n');
  showDocument(title, text);

  if (!gameState.flags.readShipManifest) {
    gameState.flags.readShipManifest = true;
    Journal.addEntry({
      chapter: 1,
      title: 'A New Beginning',
      text: 'The manifest traces a path westward. Each port a chapter in a wider world.',
    });
  }

  maybeCompleteChapter1();
}

/** UI wiring */
dom.journalToggle.addEventListener('click', () => Journal.toggle());
dom.journalClose.addEventListener('click', () => Journal.toggle(false));

// Initialize
function init() {
  dom.understandingValue.textContent = String(gameState.understandingLevel);
  showScene(gameState.currentScene);
  Journal.addEntry({
    chapter: 1,
    title: 'At the Water\'s Edge',
    text: 'I leave familiar shores with questions as provisions. The world awaits.',
  });
}

window.addEventListener('load', init);

