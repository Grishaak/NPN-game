import { CONFIG } from './constans.js';

export class StartScene extends Phaser.Scene {
  constructor() { super('StartScene'); }

  preload() {
    this.load.image('start_bg', 'assets/overlay_start.png');
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.image(width/2, height/2, 'start_bg')
                 .setDisplaySize(CONFIG.WIDTH, CONFIG.HEIGHT).setAlpha(0.9);

    const title = this.add.text(width/2, height/2 - 120, 'Escape QTE', {
      fontFamily: 'Arial', fontSize: '72px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5);

    const btnW=420, btnH=110;
    const btnBg = this.add.rectangle(0,0,btnW,btnH,0xffffff,1)
                    .setStrokeStyle(6,0x000000).setOrigin(0.5);
    const btnLabel = this.add.text(0,0,'Начать игру', {
      fontFamily:'Arial', fontSize:'42px', color:'#000000'
    }).setOrigin(0.5);
    const button = this.add.container(width/2, height/2 + 40, [btnBg, btnLabel])
                      .setSize(btnW, btnH).setInteractive({ useHandCursor:true });
    button.on('pointerover', ()=>btnBg.setScale(1.03));
    button.on('pointerout',  ()=>btnBg.setScale(1));

    button.on('pointerup', () => {
      button.disableInteractive();
      this.tweens.add({
        targets: [bg, title, button],
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeInOut',
        onComplete: () => this.scene.start('GameScene')
      });
    });
  }
}
