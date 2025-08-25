import { CONFIG, MONSTER, SCORE, BG, ATTACK, QTE, DIFF } from './constans.js';
import { createHUD, updateHUD } from './hud.js';
import { passiveDrift } from './monsterMovements.js';
import { startQTE, cancelNormalQTE } from './qte.js';
import { startSuperQTE } from './monsterAttack.js';  
const START_FREEZE_MS = 500;

export class GameScene extends Phaser.Scene {

    constructor() { super('GameScene'); }

    preload() {
        this.load.image('bg_leaves', 'assets/background/leaves_l0.png');   
        this.load.image('bg_trees', 'assets/background/trees_l1.png');   
        this.load.image('bg_trees_far', 'assets/background/trees_l2.png');
        this.load.image('bg_sky', 'assets/background/sky_l3.png');


        this.load.spritesheet('monster-run', 'assets/animations/ghost/ghost1_full.png', {
            frameWidth: 700, frameHeight: 525
        });

        this.load.spritesheet('monster-attack', 'assets/animations/ghost/ghost2_full.png', {
            frameWidth: 700, frameHeight: 525
        });


        this.load.spritesheet('jack-run', 'assets/animations/heroes/jack/jack1.png', {
            frameWidth: 320, frameHeight: 300
        });

        this.load.spritesheet('jack-happy', 'assets/animations/heroes/jack/jack2.png', {
            frameWidth: 320, frameHeight: 300
        });


        this.load.spritesheet('noks-run', 'assets/animations/heroes/noks/noks1.png', {
            frameWidth: 600, frameHeight: 450
        });

        this.load.spritesheet('noks-happy', 'assets/animations/heroes/noks/noks1.png', {
            frameWidth: 600, frameHeight: 450
        });


        this.load.spritesheet('pum-run', 'assets/animations/heroes/pum/pum1.png', {
            frameWidth: 600, frameHeight: 450
        });

        this.load.spritesheet('pum-happy', 'assets/animations/heroes/pum/pum2.png', {
            frameWidth: 600, frameHeight: 450
        });
    }

    create() {

        this.score = 0;
        this.gameOver = false;
        this.timeElapsed = 0;     
        this.pendingSuper = false;  

        this.monsterTween = null;
        this.warningText = null;
        this.qteActive = false;
        this.currentSequence = [];
        this.currentIndex = 0;
        this.qteContainer = null;
        this.qteLetters = [];
        this.qteWindowTimer = null;
        this.qteNextTimer = null;

        this.scoreText = null;
        this.timeText = null;

        this.qteBarBg = null;
        this.qteBarFg = null;
        this.qteBarTween = null;

        this.inSuperQTE = false;    
        this.superResolving = false; 


        this._keyHandler = (ev) => { }


        
        this.bg_sky1 = this.add.image(0, 0, 'bg_sky').setOrigin(0, 0).setDepth(0);
        this.bg_sky2 = this.add.image(this.bg_sky1.width, 0, 'bg_sky').setOrigin(0, 0).setDepth(0);

        this.bg_tress_far1 = this.add.image(0, 240, 'bg_trees_far').setOrigin(0, 0).setDepth(1);
        this.bg_tress_far2 = this.add.image(this.bg_tress_far1.width, 240, 'bg_trees_far').setOrigin(0, 0).setDepth(1);

        this.bg_trees1 = this.add.image(0, 280, 'bg_trees').setOrigin(0, 0).setDepth(2);
        this.bg_trees2 = this.add.image(this.bg_trees1.width, 280, 'bg_trees').setOrigin(0, 0).setDepth(2);

        this.bg_leaves1 = this.add.image(0, 588, 'bg_leaves').setOrigin(0, 0).setDepth(4);
        this.bg_leaves2 = this.add.image(this.bg_leaves1.width, 588, 'bg_leaves').setOrigin(0, 0).setDepth(4);

        
        this.player2 = this.add.sprite(CONFIG.WIDTH - 200, CONFIG.HEIGHT - 250, 'pum').setScale(0.5).setDepth(5);
        this.player1 = this.add.sprite(CONFIG.WIDTH - 200, CONFIG.HEIGHT - 150, 'noks').setScale(0.5).setDepth(5);
        this.player = this.add.sprite(CONFIG.WIDTH - 200, CONFIG.HEIGHT - 80, 'jack').setScale(0.5).setDepth(5);

        this.monster = this.add.sprite(MONSTER.START_X, CONFIG.HEIGHT / 1.25, 'monster').setScale(0.5).setDepth(5);




        if (!this.anims.exists('monster-run')) {
            this.anims.create({
                key: 'monster-run',
                frames: this.anims.generateFrameNumbers('monster-run', { start: 0, end: 30 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!this.anims.exists('monster-attack')) {
            this.anims.create({
                key: 'monster-attack',
                frames: this.anims.generateFrameNumbers('monster-attack', { start: 0, end: 30 }),
                frameRate: 24,
                repeat: 1
            });
        }

        if (!this.anims.exists('jack')) {
            this.anims.create({
                key: 'jack-run',
                frames: this.anims.generateFrameNumbers('jack-run', { start: 0, end: 11 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!this.anims.exists('jack-happy')) {
            this.anims.create({
                key: 'jack-happy',
                frames: this.anims.generateFrameNumbers('jack-happy', { start: 0, end: 11 }),
                frameRate: 16,
                repeat: 8
            });
        }


        if (!this.anims.exists('noks')) {
            this.anims.create({
                key: 'noks-run',
                frames: this.anims.generateFrameNumbers('noks-run', { start: 0, end: 11 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!this.anims.exists('noks-happy')) {
            this.anims.create({
                key: 'noks-happy',
                frames: this.anims.generateFrameNumbers('noks-happy', { start: 0, end: 11 }),
                frameRate: 24,
                repeat: 6
            });
        }


        if (!this.anims.exists('pum')) {
            this.anims.create({
                key: 'pum-run',
                frames: this.anims.generateFrameNumbers('pum-run', { start: 0, end: 11 }),
                frameRate: 24,
                repeat: -1
            });
        }

        if (!this.anims.exists('pum-happy')) {
            this.anims.create({
                key: 'pum-happy',
                frames: this.anims.generateFrameNumbers('pum-happy', { start: 0, end: 11 }),
                frameRate: 24,
                repeat: 6
            });
        }

        
        this.diffLevel = 0;

        this.monsterBaseSpeed = MONSTER.BASE_SPEED;     
        this.monsterSpeed = this.monsterBaseSpeed; 

        this.qteTimePerKeyMs = QTE.SEQ_TIME_PER_KEY;   
        this.qteNextDelayMs = QTE.NEXT_QTE_DELAY;   
        this.qtePointsReward = DIFF.POINTS_PER_QTE_BASE;

        this.superTimePerKeyMs = ATTACK.TIME_PER_KEY;   

        this.bgSpeedFactor = 1.0;


        this.PLAYER_X = this.player.x;
        this.monster.x = MONSTER.START_X;
        if (this.monsterTween) { this.monsterTween.stop(); this.monsterTween = null; }

        this._readyToRun = false;     
        this._sceneStartTs = this.time.now;

        this.time.delayedCall(START_FREEZE_MS, () => {
            this._readyToRun = true;
        });



        this.monster.play('monster-run');
        this.player2.play('pum-run');
        this.player1.play('noks-run');
        this.player.play('jack-run');
        createHUD(this);

        this.timerEvent = this.time.addEvent({
            delay: 1000, loop: true, callback: () => {
                this.timeElapsed++;  
                const add = Phaser.Math.Between(SCORE.PASSIVE_MIN, SCORE.PASSIVE_MAX);
                this.score += add;
                updateHUD(this);
            }
        });

        this.input.keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT']);

        this.diffTimer = this.time.addEvent({
            delay: DIFF.INTERVAL_SEC * 1000,
            loop: true,
            callback: () => this.raiseDifficulty()
        });
        const firstDelay = 1400;
        this.time.delayedCall(firstDelay, () => {
            if (!this.gameOver && !this.inSuperQTE && !this.superResolving && !this.pendingSuper) {
                startQTE(this);
            }
        });



        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup(false));
        this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup(true));

    }

    update() {
        if (!this.player || !this.player2 || !this.player1 || !this.monster || this.gameOver) return;
        if (this._readyToRun) {
            if (this.bg_sky1 && this.bg_sky2) {
                const dx_SKY = (BG.SPEED_L3 * MONSTER.DELTA * this.bgSpeedFactor) / 1000; 
                this.bg_sky1.x -= dx_SKY;
                this.bg_sky2.x -= dx_SKY;

                
                if ((this.bg_sky1.x + this.bg_sky1.displayWidth) <= 0) {
                    this.bg_sky1.x = this.bg_sky2.x + this.bg_sky2.displayWidth;
                }
                if ((this.bg_sky2.x + this.bg_sky2.displayWidth) <= 0) {
                    this.bg_sky2.x = this.bg_sky1.x + this.bg_sky1.displayWidth;
                }
            }
            if (this.bg_tress_far1 && this.bg_tress_far2) {
                const dx_TREES_FAR = (BG.SPEED_L2 * MONSTER.DELTA * this.bgSpeedFactor) / 1000; 
                this.bg_tress_far1.x -= dx_TREES_FAR;
                this.bg_tress_far2.x -= dx_TREES_FAR;

                
                if ((this.bg_tress_far1.x + this.bg_tress_far1.displayWidth) <= 0) {
                    this.bg_tress_far1.x = this.bg_tress_far2.x + this.bg_tress_far2.displayWidth;
                }
                if ((this.bg_tress_far2.x + this.bg_tress_far2.displayWidth) <= 0) {
                    this.bg_tress_far2.x = this.bg_tress_far1.x + this.bg_tress_far1.displayWidth;
                }
            }
            if (this.bg_trees1 && this.bg_trees2) {
                const dx_TREES = (BG.SPEED_L1 * MONSTER.DELTA * this.bgSpeedFactor) / 1000; 
                this.bg_trees1.x -= dx_TREES;
                this.bg_trees2.x -= dx_TREES;

                
                if ((this.bg_trees1.x + this.bg_trees1.displayWidth) <= 0) {
                    this.bg_trees1.x = this.bg_trees2.x + this.bg_trees2.displayWidth;
                }
                if ((this.bg_trees2.x + this.bg_trees2.displayWidth) <= 0) {
                    this.bg_trees2.x = this.bg_trees1.x + this.bg_trees1.displayWidth;
                }
            }

            if (this.bg_leaves1 && this.bg_leaves2) {
                const dx_LEAVES = (BG.SPEED_L0 * MONSTER.DELTA * this.bgSpeedFactor) / 1000;
                this.bg_leaves1.x -= dx_LEAVES;
                this.bg_leaves2.x -= dx_LEAVES;

                if ((this.bg_leaves1.x + this.bg_leaves1.displayWidth) <= 0) {
                    this.bg_leaves1.x = this.bg_leaves2.x + this.bg_leaves2.displayWidth;
                }
                if ((this.bg_leaves2.x + this.bg_leaves2.displayWidth) <= 0) {
                    this.bg_leaves2.x = this.bg_leaves1.x + this.bg_leaves1.displayWidth;
                }
            }

        }
        if (this.pendingSuper) return;

        if (this.superResolving) return;

        if (this.inSuperQTE) return;

        passiveDrift(this);

        const canTriggerNow =
            !this.inSuperQTE &&
            !this.superResolving &&
            !this.pendingSuper &&   
            (this.monster.x >= (this.PLAYER_X - ATTACK.TRIGGER_GAP));

        if (canTriggerNow) {
            this.monster.x = this.PLAYER_X - ATTACK.TRIGGER_GAP;
            this.triggerSuperWithDelay();




            return;
        }
        if (this.monster.x >= (this.PLAYER_X - MONSTER.CATCH_MARGIN) && (canTriggerNow)) {
            this.endGame('lose');
            return;
        }
    }

    endGame(result) {
        if (this.gameOver) return;
        this.gameOver = true;

        if (this._keyHandler) this.input.keyboard.off('keydown', this._keyHandler);

        if (this.timerEvent) { this.timerEvent.remove(false); this.timerEvent = null; }
        if (this.qteWindowTimer) { this.qteWindowTimer.remove(false); this.qteWindowTimer = null; }
        if (this.qteNextTimer) { this.qteNextTimer.remove(false); this.qteNextTimer = null; }
        if (this.warningText) { this.warningText.destroy(); this.warningText = null; }

        this.input.keyboard.off('keydown');

        this.scene.start('RestartScene', { result, score: this.score, timeElapsed: this.timeElapsed });
    }

    cleanup(forceDestroy) {
        if (this._keyHandler) {
            this.input.keyboard.off('keydown', this._keyHandler);
        }
        this.input.keyboard.removeAllListeners();

        if (this.timerEvent) { this.timerEvent.remove(false); this.timerEvent = null; }
        if (this.qteWindowTimer) { this.qteWindowTimer.remove(false); this.qteWindowTimer = null; }
        if (this.qteNextTimer) { this.qteNextTimer.remove(false); this.qteNextTimer = null; }

        if (this.monsterTween) { this.monsterTween.stop(); this.monsterTween = null; }
        this.tweens.killAll();

        if (this.qteContainer) { this.qteContainer.destroy(); this.qteContainer = null; }
        if (this.scoreText) { this.scoreText.destroy(); this.scoreText = null; }
        if (this.timeText) { this.timeText.destroy(); this.timeText = null; }

        if (this.monster) { this.monster.destroy(); this.monster = null; }
        if (this.player) { this.player.destroy(); this.player = null; }

        this.time.removeAllEvents();

        this.gameOver = false;
        this.qteActive = false;
        this.currentSequence = [];
        this.currentIndex = 0;

        if (this.qteBarTween) { this.qteBarTween.stop(); this.qteBarTween = null; }
        if (this.qteBarFg) { this.qteBarFg.destroy(); this.qteBarFg = null; }
        if (this.qteBarBg) { this.qteBarBg.destroy(); this.qteBarBg = null; }


        if (forceDestroy) {
        }
    }
}

GameScene.prototype.triggerSuperWithDelay = function () {
    if (this.gameOver || this.pendingSuper || this.inSuperQTE || this.superResolving) return;

    cancelNormalQTE(this);

    this.pendingSuper = true;

    this.warningText = this.add.text(
        this.scale.width / 2,
        this.scale.height / 2,
        'МОНСТР НАЧИНАЕТ АТАКУ',
        {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ff4444',
            fontStyle: 'bold',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 10 },
            align: 'center'
        }
    ).setOrigin(0.5).setDepth(2000);

    this.tweens.add({ targets: this.warningText, scale: 1.2, duration: 300, yoyo: true, repeat: -1 });

    this.time.delayedCall(1200, () => {
        if (this.gameOver || !this.pendingSuper) return;

        if (this.warningText) { this.warningText.destroy(); this.warningText = null; }

        this.pendingSuper = false;

        this.monster.x = this.PLAYER_X - ATTACK.TRIGGER_GAP;

        startSuperQTE(this);
    });
};

GameScene.prototype.raiseDifficulty = function () {
    this.diffLevel += 1;

    const newMonsterSpeed = this.monsterSpeed * DIFF.MONSTER_SPEED_PER_LVL;
    this.tweens.add({
        targets: this,
        monsterSpeed: newMonsterSpeed,
        duration: DIFF.RAMP_MS,
        ease: 'Sine.easeInOut'
    });

    const newBgFactor = this.bgSpeedFactor * DIFF.BG_SPEED_PER_LVL;
    this.tweens.add({
        targets: this,
        bgSpeedFactor: newBgFactor,
        duration: DIFF.RAMP_MS,
        ease: 'Sine.easeInOut'
    });

    const targetQteTime = Math.max(
        DIFF.LIMITS.QTE_TIME_MIN_MS,
        Math.round(this.qteTimePerKeyMs * DIFF.QTE_TIME_PER_KEY_FACTOR)
    );
    this.qteTimePerKeyMs = targetQteTime;

    const targetNextDelay = Math.max(
        DIFF.LIMITS.QTE_NEXT_DELAY_MIN_MS,
        Math.round(this.qteNextDelayMs * DIFF.QTE_NEXT_DELAY_FACTOR)
    );
    this.qteNextDelayMs = targetNextDelay;

    const targetSuperTime = Math.max(
        DIFF.LIMITS.SUPER_TIME_MIN_MS,
        Math.round(this.superTimePerKeyMs * DIFF.SUPER_TIME_PER_KEY_FACTOR)
    );
    this.superTimePerKeyMs = targetSuperTime;

    this.qtePointsReward += DIFF.POINTS_PER_QTE_STEP;

};