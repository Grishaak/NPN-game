export function createHUD(scene) {
  const style = {
    fontFamily: 'Arial',
    fontSize: '36px',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 6
  };

  scene.scoreText = scene.add.text(20, 20, `Очки: ${scene.score}`, style).setDepth(999);
  scene.timeText  = scene.add.text(scene.scale.width - 20, 20, `Время: ${formatTimeUp(scene.timeElapsed || 0)}`, style)
                     .setOrigin(1, 0).setDepth(999);
}

export function updateHUD(scene) {
  if (scene.scoreText) scene.scoreText.setText(`Очки: ${scene.score}`);
  if (scene.timeText)  scene.timeText.setText(`Время: ${formatTimeUp(scene.timeElapsed || 0)}`);
}

export function formatTimeUp(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}