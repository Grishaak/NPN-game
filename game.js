const config = {
  type: Phaser.AUTO,
  width: 1400,
  height: 900,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

// === Счёт и HUD ===
let score = 0;
let scoreText = null;
let timeText = null;

const QTE_SUCCESS_POINTS = 50;
const PASSIVE_POINTS_MIN = 1;
const PASSIVE_POINTS_MAX = 2;

const game = new Phaser.Game(config);
const JUMP_HEIGHT = 100;

let monsterTween = null;

const DELTA = 4

const MONSTER_START_X = 100;     // старт монстра слева
let PLAYER_X = 0;                // вычислим после создания сцены

const BASE_SPEED = 100;           // пассивный дрейф вперёд (px/s)

const KNOCKBACK_PIXELS = 130;    // отброс назад при успехе QTE
const LUNGE_PIXELS    = 105;     // рывок вперёд при провале QTE

const CATCH_MARGIN    = 145;   

const ALLOWED_KEYS = ['W','A','S','D']; // какие клавиши могут попадаться
const SEQ_MIN_LEN = 3;   // минимальная длина последовательности
const SEQ_MAX_LEN = 5;   // максимальная длина (подкрути под вкус)
const SEQ_TIME_PER_KEY = 600; // мс на одну кнопку (общая длительность = это * длину)
const NEXT_QTE_DELAY = 900;   // пауза перед следующим QTE, мс

let currentSequence = []; // массив букв, например ['A','B','S','C']
let currentIndex = 0;     // куда дошли
let qteContainer = null;  // контейнер с текстами букв
let qteLetters = [];


let timeLeft = 10;  // Время на победу
let qteActive = false;  // Флаг активности QTE
let currentKey = '';  // Текущая клавиша для нажатия
let timerEvent;  // Таймер игры

let player = null;
let monster = null;

let gameOver = false;
let qteWindowTimer = null; // таймер «окна» для реакции
let qteNextTimer = null;


function updateHUD() {
  if (scoreText) scoreText.setText(`Очки: ${score}`);
  if (timeText)  timeText.setText(`Время: ${timeLeft}`);
}

function preload() {
  // Загрузка ресурсов
  this.load.image('background', 'assets/background.png');
  this.load.image('player', 'assets/player.png');
  this.load.image('monster', 'assets/monster.png');

  
  this.load.image('start_bg', 'assets/overlay_start.png');
}

function create() {
  createStartOverlay(this);
}

function update() {
   if (!player || !monster || gameOver) return;

  // Пассивное продвижение вперёд (если нет активного твина)
  if (!monsterTween || !monsterTween.isPlaying()) {
    monster.x += (BASE_SPEED * DELTA) / 1000; // px/s -> px per frame
  }

  // Проигрыш: монстр «догнал»
  if (monster.x >= (PLAYER_X - CATCH_MARGIN)) {
    endGame(this, 'lose');
    return;
  }

  // Победа по таймеру
  if (timeLeft <= 0) {
    endGame(this, 'win');
    return;
  }
}

function stopMonsterTween() {
  if (monsterTween) {
    monsterTween.stop();
    monsterTween = null;
  }
}

function monsterKnockback(scene) {
  if (!monster) return;
  stopMonsterTween();

  const targetX = Math.max(MONSTER_START_X, monster.x - KNOCKBACK_PIXELS);

  // лёгкий squash & stretch (необязательно, но выглядит живее)
  scene.tweens.add({
    targets: monster,
    scaleX: 0.45,
    scaleY: 0.55,
    duration: 200,
    yoyo: true,
    ease: 'Quad.easeOut'
  });

  monsterTween = scene.tweens.add({
    targets: monster,
    x: targetX,
    duration: 330,
    ease: 'Back.easeOut',
  });
}


function monsterLunge(scene) {
  if (!monster) return;
  stopMonsterTween();

  const targetX = Math.min(PLAYER_X, monster.x + LUNGE_PIXELS);

  scene.tweens.add({
    targets: monster,
    scaleX: 0.45,
    scaleY: 0.55,
    duration: 100,
    yoyo: true,
    ease: 'Quad.easeIn'
  });

  monsterTween = scene.tweens.add({
    targets: monster,
    x: targetX,
    duration: 150,
    ease: 'Quad.easeOut'
  });
}

function createStartOverlay(scene) {
  const { width, height } = scene.scale;

  // Фон
  const bg = scene.add.image(width / 2, height / 2, 'start_bg');
  bg.setDisplaySize(width, height); // растянуть на всю сцену
  bg.setAlpha(0.9);

  // Текст названия
  const title = scene.add.text(width / 2, height / 2 - 120, 'NPN', {
    fontFamily: 'Arial',
    fontSize: '72px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 6
  }).setOrigin(0.5);

  // Кнопка «Начать игру»
  const btnWidth = 420;
  const btnHeight = 110;
  const buttonBg = scene.add.rectangle(0, 0, btnWidth, btnHeight, 0xffffff, 1)
    .setStrokeStyle(6, 0x000000)
    .setOrigin(0.5);

  const buttonLabel = scene.add.text(0, 0, 'Начать игру', {
    fontFamily: 'Arial',
    fontSize: '42px',
    color: '#000000'
  }).setOrigin(0.5);

  const button = scene.add.container(width / 2, height / 2 + 40, [buttonBg, buttonLabel])
    .setSize(btnWidth, btnHeight)
    .setInteractive({ useHandCursor: true });

  button.on('pointerover', () => {
    buttonBg.setScale(1.03);
  });
  button.on('pointerout', () => {
    buttonBg.setScale(1);
  });

  // Собираем оверлей в контейнер для удобного fade
  const overlay = scene.add.container(0, 0, [bg, title, button]);
  overlay.setDepth(1000); // поверх всего

  // Клик по кнопке: плавно скрыть оверлей и стартовать игру
  button.on('pointerup', () => {
    button.disableInteractive();
    scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        overlay.destroy();
        initGame(scene);
      }
    });
  });
}

function endGame(scene, result) {
  if (gameOver) return;
  gameOver = true;

  // остановить таймеры
  if (timerEvent) { timerEvent.remove(false); timerEvent = null; }
  if (qteWindowTimer) { qteWindowTimer.remove(false); qteWindowTimer = null; }
  if (qteNextTimer) { qteNextTimer.remove(false); qteNextTimer = null; }
  if (qteContainer) { qteContainer.destroy(); qteContainer = null; }

  qteLetters = [];
  qteActive = false;
  // отключить ввод
  scene.input.keyboard.off('keydown', handleKeyPressSeq);

  // показать оверлей результата
  showEndOverlay(scene, result);
}


function showEndOverlay(scene, result) {
  const { width, height } = scene.scale;

  // полупрозрачная подложка
  const dim = scene.add.rectangle(0, 0, width, height, 0x000000, 0.6)
    .setOrigin(0)
    .setAlpha(0);

  const titleText = (result === 'win') ? 'Победа!' : 'Поражение';
  const subtitleText = (result === 'win')
    ? 'Ты успешно убежал от монстра'
    : 'Монстр догнал тебя';

  const title = scene.add.text(width / 2, height / 2 - 120, titleText, {
    fontFamily: 'Arial',
    fontSize: '72px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 6
  }).setOrigin(0.5).setAlpha(0);

  const subtitle = scene.add.text(width / 2, height / 2 - 50, subtitleText, {
    fontFamily: 'Arial',
    fontSize: '32px',
    color: '#ffffff'
  }).setOrigin(0.5).setAlpha(0);

  // кнопка «Начать заново»
  const btnW = 420, btnH = 110;
  const btnBg = scene.add.rectangle(0, 0, btnW, btnH, 0xffffff, 1)
    .setStrokeStyle(6, 0x000000)
    .setOrigin(0.5);
  const btnLabel = scene.add.text(0, 0, 'Начать заново', {
    fontFamily: 'Arial',
    fontSize: '42px',
    color: '#000000'
  }).setOrigin(0.5);
  const button = scene.add.container(width / 2, height / 2 + 60, [btnBg, btnLabel])
    .setSize(btnW, btnH)
    .setInteractive({ useHandCursor: true })
    .setAlpha(0);

  button.on('pointerover', () => btnBg.setScale(1.03));
  button.on('pointerout', () => btnBg.setScale(1));
  button.on('pointerup', () => {
    button.disableInteractive();
    // плавно скрыть и перезапустить сцену
    scene.tweens.add({
      targets: [dim, title, subtitle, button],
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        scene.scene.restart();
        resetGlobals();
      }
    });
  });

  // собрать в контейнер для удобного фейда
  const overlay = scene.add.container(0, 0, [dim, title, subtitle, button]).setDepth(2000);

  // плавное появление элементов
  scene.tweens.add({ targets: dim, alpha: 1, duration: 250, ease: 'Quad.easeOut' });
  scene.tweens.add({ targets: [title, subtitle, button], alpha: 1, delay: 150, duration: 350, ease: 'Quad.easeOut' });
}



function monsterKnockbackArc(scene) {
  if (!monster) return;
  stopMonsterTween();

  const startX = monster.x;
  const startY = monster.y;
  const endX   = Math.max(MONSTER_START_X, startX - KNOCKBACK_PIXELS);
  const peakX  = (startX + endX) / 2;
  const peakY  = startY - JUMP_HEIGHT;

  // Кривая Безье: старт -> пик -> финиш
  const curve = new Phaser.Curves.QuadraticBezier(
    new Phaser.Math.Vector2(startX, startY),
    new Phaser.Math.Vector2(peakX,  peakY),
    new Phaser.Math.Vector2(endX,   startY)
  );

  const proxy = { t: 0 };
  monsterTween = scene.tweens.add({
    targets: proxy,
    t: 1,
    duration: 280,             // дольше = плавнее
    ease: 'Sine.easeOut',
    onUpdate: () => {
      const p = curve.getPoint(proxy.t);
      monster.setPosition(p.x, p.y);
    },
    onComplete: () => {
      monster.setY(startY);    // на всякий случай вернуть точное «земляное» Y
    }
  });

  // Небольшой squash для живости (опционально)
  scene.tweens.add({
    targets: monster,
    scaleX: 0.45,
    scaleY: 0.55,
    duration: 180,
    yoyo: true,
    ease: 'Quad.easeOut'
  });
}


function initGame(scene) {

  const hudStyle = {
  fontFamily: 'Arial',
  fontSize: '36px',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 6
  };

  scoreText = scene.add.text(20, 20, 'Очки: 0', hudStyle).setDepth(999);

  timeText = scene.add.text(scene.scale.width - 20, 20, `Время: ${timeLeft}`, hudStyle)
    .setOrigin(1, 0)
    .setDepth(999);


  const { width, height } = scene.scale;

  // Фон
  scene.add.image(width / 2, height / 2, 'background')
    .setDisplaySize(width, height);

  // Игрок справа, монстр слева. Уменьшаем масштаб при необходимости
  player = scene.add.sprite(width - 100, height / 1.2, 'player').setScale(0.5);
  monster = scene.add.sprite(MONSTER_START_X, height / 1.25, 'monster').setScale(0.5);

  PLAYER_X = player.x

  // Таймер обратного отсчета
  // Таймер обратного отсчёта + пассивные очки
  timerEvent = scene.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {
      if (timeLeft > 0) {
        timeLeft--;

        // пассивный прирост очков 1…2 каждый тик
        const add = Phaser.Math.Between(PASSIVE_POINTS_MIN, PASSIVE_POINTS_MAX);
        score += add;

        updateHUD();
      }
    }
  });

  // Запуск первого QTE
  startQTE(scene);

  // Обработчик нажатий
  scene.input.keyboard.on('keydown', handleKeyPressSeq);
}


function startQTE(scene) {
  if (gameOver) return;

  // 1) подчистить прошлый UI, если был
  if (qteContainer) { qteContainer.destroy(); qteContainer = null; }
  qteLetters = [];

  // 2) сгенерировать последовательность случайной длины
  const len = Phaser.Math.Between(SEQ_MIN_LEN, SEQ_MAX_LEN);
  currentSequence = Array.from({ length: len }, () => Phaser.Utils.Array.GetRandom(ALLOWED_KEYS));
  currentIndex = 0;

  // 3) отрисовать буквы по центру
  const { width } = scene.scale;
  const y = 90;                 // где показывать QTE
  const letterSpacing = 60;     // расстояние между буквами
  const totalWidth = (len - 1) * letterSpacing;
  const startX = (width / 2) - (totalWidth / 2);

  qteContainer = scene.add.container(0, 0).setDepth(900);

  for (let i = 0; i < len; i++) {
    const ch = currentSequence[i];
    const txt = scene.add.text(startX + i * letterSpacing, y, ch, {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    qteLetters.push(txt);
    qteContainer.add(txt);
  }
  updateQTEVisuals(); // подсветим текущую букву

  // 4) активировать
  qteActive = true;

  // 5) общее окно времени на всю последовательность
  const totalDuration = SEQ_TIME_PER_KEY * currentSequence.length;
  qteWindowTimer = scene.time.delayedCall(totalDuration, () => {
    if (qteActive && !gameOver) {
      // не успел — считаем ошибкой
      endQTE(scene, false);
    }
  });

  // 6) клавиатура: передаём scene внутрь обработчика
  scene.input.keyboard.off('keydown'); // на всякий случай снять прошлые
  scene.input.keyboard.on('keydown', (ev) => handleKeyPressSeq(scene, ev));
}


function updateQTEVisuals() {
  for (let i = 0; i < qteLetters.length; i++) {
    const t = qteLetters[i];
    if (i < currentIndex) {
      t.setColor('#36da3eff'); // прошедшие — зелёные
      t.setAlpha(0.6);
      t.setScale(1.0);
    } else if (i === currentIndex) {
      t.setColor('#f3ef1bff'); // текущая — жёлтая
      t.setAlpha(1);
      t.setScale(1.2);
    } else {
      t.setColor('#ffffff'); // ожидающие — белые
      t.setAlpha(0.85);
      t.setScale(1.0);
    }
  }
}

function handleKeyPressSeq(scene, event) {
  if (!qteActive || gameOver) return;

  const key = event.key.toUpperCase();
  const need = currentSequence[currentIndex];

  if (key === need) {
    // верная буква
    currentIndex++;
    updateQTEVisuals();

    if (currentIndex >= currentSequence.length) {
      // вся последовательность введена
      endQTE(scene, true);
    }
  } else if (ALLOWED_KEYS.includes(key)) {
    // неверная из набора — сразу провал
    endQTE(scene, false);
  } else {
    // посторонние клавиши игнорим
  }
}

function endQTE(scene, success) {
  if (!qteActive) return;
  qteActive = false;

  // остановить окно
  if (qteWindowTimer) { qteWindowTimer.remove(false); qteWindowTimer = null; }

  // эффект на монстре
  if (success) {
    score += QTE_SUCCESS_POINTS;   // <— очки за QTE
    updateHUD();     
    monsterKnockbackArc(scene); // прыжок назад по дуге
  } else {
    monsterLunge(scene);        // рывок вперёд
  }

  // убрать UI
  if (qteContainer) { qteContainer.destroy(); qteContainer = null; }
  qteLetters = [];

  // следующее QTE
  qteNextTimer = scene.time.delayedCall(NEXT_QTE_DELAY, () => {
    if (!gameOver) startQTE(scene);
  });
}

function resetGlobals() {
  timeLeft = 30;
  monsterDistance = 0;
  monsterTween = null;
  qteActive = false;
  timerEvent = null;
  player = null;
  monster = null;
  gameOver = false;
  qteWindowTimer = null;
  qteNextTimer = null;
  score = 0;
  currentSequence = [];
}