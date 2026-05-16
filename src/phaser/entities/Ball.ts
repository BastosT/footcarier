/**
 * Ball - Entité ballon sur le terrain.
 */

import Phaser from 'phaser';

export class BallEntity {
  public sprite: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.circle(x, y, 6, 0xffffff);
    this.sprite.setStrokeStyle(1, 0x000000);
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
