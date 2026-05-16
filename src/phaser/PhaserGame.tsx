/**
 * PhaserGame - Composant React wrapper pour le canvas Phaser.
 */

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createPhaserConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { MatchScene } from './scenes/MatchScene';

interface PhaserGameProps {
  onMatchEnd?: () => void;
}

export function PhaserGame({ onMatchEnd }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config = createPhaserConfig('phaser-container');
    config.scene = [BootScene, MatchScene];

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Listen for match end
    game.events.on('matchEnd', () => {
      onMatchEnd?.();
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [onMatchEnd]);

  return (
    <div
      id="phaser-container"
      ref={containerRef}
      className="w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl"
      style={{ aspectRatio: '800/500' }}
    />
  );
}
