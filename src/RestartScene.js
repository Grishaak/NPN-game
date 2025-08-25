import { CONFIG } from './constans.js';
import { formatTimeUp } from './hud.js';

export class RestartScene extends Phaser.Scene {
  constructor() { super('RestartScene'); }

  preload() {
    this.load.image('start_bg', './assets/overlay_start.png'); 
  }

  create(data) {
    const { width, height } = this.scale;
    const { result = 'lose', score = 0, timeElapsed = 0 } = data || {};

    const bg = this.add.image(width / 2, height / 2, 'start_bg')
      .setDisplaySize(CONFIG.WIDTH, CONFIG.HEIGHT).setAlpha(0.9);

    const timeStr = formatTimeUp ? formatTimeUp(timeElapsed) : `${timeElapsed}s`; 
    const subtitleText =
      (result === 'win')
        ? `Очки: ${score}  Время: ${timeStr}`  
        : `Монстр догнал тебя. Очки: ${score}  Время: ${timeStr}`;

    const title = this.add.text(width / 2, height / 2 - 120, timeStr, {
      fontFamily: 'Arial', fontSize: '72px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height / 2 - 50, subtitleText, {
      fontFamily: 'Arial', fontSize: '32px', color: '#ffffff'
    }).setOrigin(0.5);

    const bw = 420, bh = 110;
    const bBg = this.add.rectangle(0, 0, bw, bh, 0xffffff, 1).setStrokeStyle(6, 0x000000).setOrigin(0.5);
    const bTx = this.add.text(0, 0, 'Начать заново', { fontFamily: 'Arial', fontSize: '42px', color: '#000' }).setOrigin(0.5);
    const button = this.add.container(width / 2, height / 2 + 60, [bBg, bTx])
      .setSize(bw, bh).setInteractive({ useHandCursor: true });

    button.on('pointerover', () => bBg.setScale(1.03));
    button.on('pointerout', () => bBg.setScale(1));
    button.on('pointerup', () => {
      button.disableInteractive();
      this.tweens.add({
        targets: [bg, title, subtitle, button],
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeInOut',
        onComplete: () => this.scene.start('GameScene')
      });
    });
  }
}
