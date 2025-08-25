import { MONSTER, ATTACK } from './constans.js';

export function stopMonsterTween(scene) {
  if (scene.monsterTween) {
    scene.monsterTween.stop();
    scene.monsterTween = null;
  }
}

export function passiveDrift(scene) {
  if (!scene.monsterTween || !scene.monsterTween.isPlaying()) {
    scene.monster.x += (scene.monsterSpeed * MONSTER.DELTA) / 1000;
  }
}

export function monsterLunge(scene) {
  if (!scene.monster || scene.gameOver) return;
  stopMonsterTween(scene);

  const stopX = scene.PLAYER_X - ATTACK.TRIGGER_GAP; 
  const rawTarget = scene.monster.x + MONSTER.LUNGE_PIXELS;

  const willCross = rawTarget >= stopX;
  const closeEnoughToPark = !willCross && (stopX - rawTarget) <= 24;

  const targetX = willCross
    ? stopX
    : (closeEnoughToPark ? stopX : rawTarget);


  const duration = Phaser.Math.Clamp(Math.abs(targetX - scene.monster.x) * 3, 120, 260);


  scene.monsterTween = scene.tweens.add({
    targets: scene.monster,
    x: targetX,
    duration: 500,
    ease: 'Expo.ease',
    onComplete: () => {
      const dx = Math.abs(scene.monster.x - stopX);
      if (dx <= 2) scene.monster.x = stopX;

      if (scene.monster.x >= stopX - 0.5) {
        stopMonsterTween(scene);
        if (typeof scene.triggerSuperWithDelay === 'function') {
          scene.triggerSuperWithDelay();
        }
      }
    }
  });
}

export function monsterKnockbackArc(scene) {
  if (!scene.monster) return;
  stopMonsterTween(scene);

  const startX = scene.monster.x;
  const startY = scene.monster.y;
  const endX = Math.max(MONSTER.START_X, startX - MONSTER.KNOCKBACK_PIXELS);
  const peakX = (startX + endX) / 2;
  const peakY = startY - MONSTER.JUMP_HEIGHT;


  const curve = new Phaser.Curves.QuadraticBezier(
    new Phaser.Math.Vector2(startX, startY),
    new Phaser.Math.Vector2(peakX, peakY),
    new Phaser.Math.Vector2(endX, startY)
  );

  const proxy = { t: 0 };
  scene.monsterTween = scene.tweens.add({
    targets: proxy,
    t: 1,
    duration: 380,
    ease: 'Sine.easeOut',
    onUpdate: () => {
      const p = curve.getPoint(proxy.t);
      scene.monster.setPosition(p.x, p.y);
    },
    onComplete: () => {
      scene.monster.setY(startY);
    }
  });

  scene.tweens.add({
    targets: scene.monster,
    scaleX: 0.45,
    scaleY: 0.55,
    duration: 180,
    yoyo: true,
    ease: 'Quad.easeOut'
  });
}

export function monsterStrongKnockbackArc(scene) {
  if (!scene.monster) return;
  if (scene.monsterTween) { scene.monsterTween.stop(); scene.monsterTween = null; }

  const startX = scene.monster.x;
  const startY = scene.monster.y;
  const endX = Math.max(MONSTER.START_X, startX - ATTACK.STRONG_KNOCKBACK);
  const peakX = (startX + endX) / 2;
  const peakY = startY - (MONSTER.JUMP_HEIGHT + 40);

  const curve = new Phaser.Curves.QuadraticBezier(
    new Phaser.Math.Vector2(startX, startY),
    new Phaser.Math.Vector2(peakX, peakY),
    new Phaser.Math.Vector2(endX, startY)
  );

  const proxy = { t: 0 };
  scene.monsterTween = scene.tweens.add({
    targets: proxy, t: 1, duration: 520, ease: 'Sine.easeOut',
    onUpdate: () => {
      const p = curve.getPoint(proxy.t);
      scene.monster.setPosition(p.x, p.y);
    },
    onComplete: () => scene.monster.setY(startY)
  });

  scene.tweens.add({ targets: scene.monster, scaleX: 0.45, scaleY: 0.55, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
}