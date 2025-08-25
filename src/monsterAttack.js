import { ATTACK, QTE, MONSTER } from './constans.js';
import { monsterStrongKnockbackArc } from './monsterMovements.js';
import { cancelNormalQTE, startQTE } from './qte.js';

const BAR_W = 520, BAR_H = 16;

export function startSuperQTE(scene) {
    if (scene.gameOver || scene.inSuperQTE || scene.superResolving) return;


    scene.inSuperQTE = true;    
    scene.monster.x = scene.PLAYER_X - ATTACK.TRIGGER_GAP;
    if (scene.qteContainer) { scene.qteContainer.destroy(); scene.qteContainer = null; }
    scene.qteLetters = [];
    scene.currentSequence = Array.from({ length: ATTACK.SEQ_LEN }, () =>
        Phaser.Utils.Array.GetRandom(QTE.ARROW_KEYS)
    );
    scene.currentIndex = 0;

    const y = 80, spacing = 90;
    const totalW = (ATTACK.SEQ_LEN - 1) * spacing;
    const startX = (scene.scale.width / 2) - (totalW / 2);

    scene.qteContainer = scene.add.container(0, 0).setDepth(1200);
    for (let i = 0; i < scene.currentSequence.length; i++) {
        const keyName = scene.currentSequence[i];
        const glyph = QTE.ARROW_GLYPH[keyName] || '?';
        const txt = scene.add.text(startX + i * spacing, y, glyph, {
            fontFamily: 'Arial', fontSize: '50px', color: '#ffffff',
            stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);
        scene.qteLetters.push(txt);
        scene.qteContainer.add(txt);
    }
    colorCurrent(scene);


    initBar(scene);
    const totalDuration =  (scene.qteTimePerKeyMs || 650 ) * scene.currentSequence.length;
    scene.attackBarTween = scene.tweens.add({
        targets: scene.attackBarFg, scaleX: 0, duration: totalDuration, ease: 'Linear',
        onUpdate: (tw, t) => {
            const prog = 1 - t.scaleX; // 0..1
            const r = 0xff, g = Math.floor(0xcc - prog * 160), b = 0x55;
            t.fillColor = (r << 16) | (g << 8) | b;
        },
        onComplete: () => {
            if (scene.inSuperQTE && scene.currentIndex < scene.currentSequence.length) {
                resolveSuper(scene, /*success=*/false);
            }
        }
    });

    if (scene._keyHandler) scene.input.keyboard.off('keydown', scene._keyHandler);
    scene._keyHandler = (ev) => handleKey(scene, ev);
    scene.input.keyboard.on('keydown', scene._keyHandler);
}

function handleKey(scene, event) {
    if (scene.gameOver || !scene.inSuperQTE) return;

    let key = event.key;
    if (key.startsWith('Arrow')) event.preventDefault?.();

    const need = scene.currentSequence[scene.currentIndex];
    if (key === need) {
        scene.currentIndex++;
        colorCurrent(scene);
        if (scene.currentIndex >= scene.currentSequence.length) {
            resolveSuper(scene, /*success=*/true);
        }
    } else if (QTE.ARROW_KEYS.includes(key)) {
        resolveSuper(scene, /*success=*/false);
    }
}

function resolveSuper(scene, success) {
    cleanupBar(scene);
    if (scene.qteContainer) { scene.qteContainer.destroy(); scene.qteContainer = null; }
    scene.qteLetters = [];
    scene.inSuperQTE = false;

    scene.superResolving = true;

    if (success) {
        monsterStrongKnockbackArc(scene);
        scene.time.delayedCall(50, () => {
            scene.monster.play('monster-attack')
            scene.time.delayedCall(1200, () => {
                scene.monster.play('monster-run');
            });
        });



        scene.time.delayedCall(100, () => {



            scene.player2.play('pum-happy');
            scene.player1.play('noks-happy');
            scene.player.play('jack-happy');

            scene.time.delayedCall(ATTACK.NEXT_DELAY + 1200, () => {


                scene.player2.play('pum-run');
                scene.player1.play('noks-run');
                scene.player.play('jack-run');
                scene.superResolving = false; 
                scene.time.delayedCall(400, () => {
                    if (!scene.gameOver && !scene.inSuperQTE && !scene.superResolving) {
                        startQTE(scene);
                    }
                });
            });
        });

    } else {
        scene.tweens.add({
            targets: scene.monster,
            x: Math.min(scene.PLAYER_X - MONSTER.CATCH_MARGIN, scene.monster.x + 20),
            duration: 120,
            ease: 'Quad.easeIn',
            onComplete: () => scene.monster.play('monster-attack')
        });
        scene.time.delayedCall(800, () => {
            scene.superResolving = false; 
            scene.endGame('lose')
        });

    }
}

function colorCurrent(scene) {
    for (let i = 0; i < scene.qteLetters.length; i++) {
        const t = scene.qteLetters[i];
        if (i < scene.currentIndex) t.setColor('#7CFC00').setAlpha(0.6).setScale(1.0);
        else if (i === scene.currentIndex) t.setColor('#ffe066').setAlpha(1).setScale(1.2);
        else t.setColor('#ffffff').setAlpha(0.85).setScale(1.0);
    }
}

function initBar(scene) {
    const barY = 130, barX = (scene.scale.width - BAR_W) / 2;
    cleanupBar(scene);
    scene.attackBarBg = scene.add.rectangle(barX, barY, BAR_W, BAR_H, 0x222222, 0.9).setOrigin(0, 0.5).setDepth(1200);
    scene.attackBarFg = scene.add.rectangle(barX, barY, BAR_W, BAR_H, 0xffcc55, 1).setOrigin(0, 0.5).setDepth(1201);
    scene.attackBarFg.scaleX = 1;
}

function cleanupBar(scene) {
    if (scene.attackBarTween) { scene.attackBarTween.stop(); scene.attackBarTween = null; }
    if (scene.attackBarFg) { scene.attackBarFg.destroy(); scene.attackBarFg = null; }
    if (scene.attackBarBg) { scene.attackBarBg.destroy(); scene.attackBarBg = null; }
}