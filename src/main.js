import { CONFIG } from './constans.js';
import { StartScene } from './startScene.js';
import { GameScene } from './gameScene.js';
import { RestartScene } from './RestartScene.js';

const config = {
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  backgroundColor: CONFIG.BACKGROUND_COLOR,
  scene: [StartScene, GameScene, RestartScene]
};

new Phaser.Game(config);
