/**
 * Configuration Phaser 3 pour le jeu de match 2D.
 */

import Phaser from 'phaser';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 500;

export function createPhaserConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#2d8a4e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [],
  };
}
