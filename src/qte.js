import { QTE, SCORE, QTE_BAR, DIFF } from './constans.js';
import { monsterKnockbackArc, monsterLunge } from './monsterMovements.js';
import { updateHUD } from './hud.js';

export function startQTE(scene) {
    if (scene.gameOver) return;

    if (scene.qteContainer) { scene.qteContainer.destroy(); scene.qteContainer = null; }
    scene.qteLetters = [];

    const len = Phaser.Math.Between(QTE.SEQ_MIN_LEN, QTE.SEQ_MAX_LEN);
    scene.currentSequence = Array.from({ length: len }, () =>
        Phaser.Utils.Array.GetRandom(QTE.ARROW_KEYS)
    );
    scene.currentIndex = 0;

    const y = 90, spacing = 90;
    const totalW = (len - 1) * spacing;
    const startX = (scene.scale.width / 2) - (totalW / 2);

    scene.qteContainer = scene.add.container(0, 0).setDepth(900);

    for (let i = 0; i < len; i++) {
        const keyName = scene.currentSequence[i];
        const glyph = QTE.ARROW_GLYPH[keyName] || '?';
        const txt = scene.add.text(startX + i * spacing, y, glyph, {
            fontFamily: 'Arial',
            fontSize: '50px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        scene.qteLetters.push(txt);
        scene.qteContainer.add(txt);
    }
    updateQTEVisuals(scene);

    scene.qteActive = true;

    const barY = 140; 
    const barX = (scene.scale.width - QTE_BAR.QTE_BAR_WIDTH) / 2;
    if (scene.qteBarTween) { scene.qteBarTween.stop(); scene.qteBarTween = null; }
    if (scene.qteBarFg) { scene.qteBarFg.destroy(); scene.qteBarFg = null; }
    if (scene.qteBarBg) { scene.qteBarBg.destroy(); scene.qteBarBg = null; }
    scene.qteBarBg = scene.add.rectangle(
        barX, barY, QTE_BAR.QTE_BAR_WIDTH, QTE_BAR.QTE_BAR_HEIGHT, 0x222222, 0.9
    ).setOrigin(0, 0.5).setDepth(900);
    scene.qteBarFg = scene.add.rectangle(
        barX, barY, QTE_BAR.QTE_BAR_WIDTH, QTE_BAR.QTE_BAR_HEIGHT, 0x55cc55, 1
    ).setOrigin(0, 0.5).setDepth(901);

    scene.qteBarFg.scaleX = 1;


    const totalDuration = scene.qteTimePerKeyMs * scene.currentSequence.length;
    scene.tweens.add({
        targets: scene.qteLetters,
        scale: 1, 
        duration: 1200,
        yoyo: true,
        ease: 'Sine.easeInOut',
        repeat: Math.ceil(totalDuration / 1200)
    });

    scene.qteBarTween = scene.tweens.add({
        targets: scene.qteBarFg,
        scaleX: 0,
        duration: totalDuration,
        ease: 'Linear',
        onUpdate: (tw, target) => {
          
            const t = 1 - target.scaleX; 
            const r = Math.floor(0x55 + t * (0xff - 0x55));
            const g = Math.floor(0xcc - t * (0xcc - 0x55)); 
            const b = Math.floor(0x55);                      
            const color = (r << 16) | (g << 8) | b;
            target.fillColor = color;
        }
    });




    scene.qteWindowTimer = scene.time.delayedCall(totalDuration, () => {
        if (scene.qteActive && !scene.gameOver) endQTE(scene, false);
    });

    if (scene._keyHandler) {
        scene.input.keyboard.off('keydown', scene._keyHandler);
    }
    scene._keyHandler = (ev) => handleKeyPressSeq(scene, ev);
    scene.input.keyboard.on('keydown', scene._keyHandler);
}

function updateQTEVisuals(scene) {
    for (let i = 0; i < scene.qteLetters.length; i++) {
        const t = scene.qteLetters[i];
        if (i < scene.currentIndex) {
            t.setColor('#26a00eff').setAlpha(0.9).setScale(1.0);
        } else if (i === scene.currentIndex) {
            t.setColor('#e4e124ff').setAlpha(1).setScale(1.2);
        } else {
            t.setColor('#ffffff').setAlpha(0.9).setScale(1.2);
        }
    }
}

function handleKeyPressSeq(scene, event) {
    if (!scene.qteActive || scene.gameOver) return;

    const key = event.key;
    const need = scene.currentSequence[scene.currentIndex];
    const t = scene.qteLetters[scene.currentIndex];

    if (key.startsWith('Arrow')) {
        event.preventDefault?.();
    }

    if (key === need) {
        if (t) scene.tweens.add({ targets: t, y: t.y - 8, duration: 80, yoyo: true });

        scene.currentIndex++;
        updateQTEVisuals(scene);

        if (scene.currentIndex >= scene.currentSequence.length) {
            endQTE(scene, true);
        }
    } else if (QTE.ARROW_KEYS.includes(key)) {
        endQTE(scene, false);
    } else {

    }
}

function endQTE(scene, success) {
    if (!scene.qteActive) return;
    scene.qteActive = false;

    if (scene.qteWindowTimer) { scene.qteWindowTimer.remove(false); scene.qteWindowTimer = null; }

    if (scene.qteBarTween) { scene.qteBarTween.stop(); scene.qteBarTween = null; }
    if (scene.qteBarFg) { scene.qteBarFg.destroy(); scene.qteBarFg = null; }
    if (scene.qteBarBg) { scene.qteBarBg.destroy(); scene.qteBarBg = null; }

    if (success) {  
        scene.score += (scene.qtePointsReward || DIFF.POINTS_PER_QTE_BASE);
        updateHUD(scene);
        monsterKnockbackArc(scene);
    } else {
        monsterLunge(scene);
    }

    if (scene.qteContainer) { scene.qteContainer.destroy(); scene.qteContainer = null; }
    scene.qteLetters = [];

    scene.qteNextTimer = scene.time.delayedCall(scene.qteNextDelayMs, () => {
        if (!scene.gameOver && !scene.inSuperQTE && !scene.superResolving) {
            startQTE(scene);
        }
    });
}

export function cancelNormalQTE(scene) {
    if (scene.qteWindowTimer) { scene.qteWindowTimer.remove(false); scene.qteWindowTimer = null; }
    if (scene.qteNextTimer) { scene.qteNextTimer.remove(false); scene.qteNextTimer = null; }

    if (scene.qteBarTween) { scene.qteBarTween.stop(); scene.qteBarTween = null; }
    if (scene.qteBarFg) { scene.qteBarFg.destroy(); scene.qteBarFg = null; }
    if (scene.qteBarBg) { scene.qteBarBg.destroy(); scene.qteBarBg = null; }

    if (scene.qteContainer) { scene.qteContainer.destroy(); scene.qteContainer = null; }
    scene.qteLetters = [];

    if (scene._keyHandler) {
        scene.input.keyboard.off('keydown', scene._keyHandler);
        scene._keyHandler = null;
    }

    scene.qteActive = false;
    scene.currentSequence = [];
    scene.currentIndex = 0;
}
