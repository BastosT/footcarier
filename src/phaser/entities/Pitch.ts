/**
 * Pitch - Entité terrain de football 2D.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class Pitch {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.draw();
  }

  private draw() {
    const g = this.graphics;
    const margin = 40;

    g.fillStyle(0x2d8a4e);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    g.lineStyle(2, 0xffffff, 0.8);
    g.strokeRect(margin, margin, GAME_WIDTH - margin * 2, GAME_HEIGHT - margin * 2);
    g.lineBetween(GAME_WIDTH / 2, margin, GAME_WIDTH / 2, GAME_HEIGHT - margin);
    g.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 60);
  }
}
