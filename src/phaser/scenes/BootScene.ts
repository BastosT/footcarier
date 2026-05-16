/**
 * BootScene - Scène de démarrage Phaser.
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // No assets to preload for now (using graphics primitives)
  }

  create() {
    this.scene.start('MatchScene');
  }
}
