/**
 * Player - Entité joueur sur le terrain (sprite cercle).
 */

import Phaser from 'phaser';

export class PlayerEntity {
  public sprite: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number, isHighlighted = false) {
    this.sprite = scene.add.circle(x, y, isHighlighted ? 13 : 10, color);
    this.sprite.setStrokeStyle(2, 0xffffff);
    if (isHighlighted) {
      this.sprite.setFillStyle(0xfbbf24);
    }
  }

  moveTo(x: number, y: number, duration: number, scene: Phaser.Scene) {
    scene.tweens.add({
      targets: this.sprite,
      x, y,
      duration,
      ease: 'Sine.easeInOut',
    });
  }
}
