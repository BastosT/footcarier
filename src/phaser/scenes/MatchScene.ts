/**
 * MatchScene - Scène principale de match 2D avec terrain, joueurs et ballon.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MatchScene extends Phaser.Scene {
  private ball!: Phaser.GameObjects.Arc;
  private players: Phaser.GameObjects.Arc[] = [];
  private matchMinute = 0;
  private timerEvent!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'MatchScene' });
  }

  create() {
    this.drawPitch();
    this.createPlayers();
    this.createBall();
    this.startMatchTimer();
  }

  private drawPitch() {
    const g = this.add.graphics();

    // Field background
    g.fillStyle(0x2d8a4e);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Field lines
    g.lineStyle(2, 0xffffff, 0.8);

    // Outer boundary
    g.strokeRect(40, 30, GAME_WIDTH - 80, GAME_HEIGHT - 60);

    // Center line
    g.lineBetween(GAME_WIDTH / 2, 30, GAME_WIDTH / 2, GAME_HEIGHT - 30);

    // Center circle
    g.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 60);

    // Penalty areas
    g.strokeRect(40, GAME_HEIGHT / 2 - 80, 100, 160);
    g.strokeRect(GAME_WIDTH - 140, GAME_HEIGHT / 2 - 80, 100, 160);

    // Goals
    g.lineStyle(3, 0xffffff, 1);
    g.strokeRect(30, GAME_HEIGHT / 2 - 30, 10, 60);
    g.strokeRect(GAME_WIDTH - 40, GAME_HEIGHT / 2 - 30, 10, 60);
  }

  private createPlayers() {
    // Home team (blue)
    const homePositions = [
      [80, 250], [180, 100], [180, 250], [180, 400],
      [300, 150], [300, 350], [420, 100], [420, 250], [420, 400],
      [550, 200], [550, 300],
    ];

    for (const [x, y] of homePositions) {
      const player = this.add.circle(x, y, 10, 0x1e40af);
      player.setStrokeStyle(2, 0xffffff);
      this.players.push(player);
    }

    // Away team (red)
    const awayPositions = [
      [720, 250], [620, 100], [620, 250], [620, 400],
      [500, 150], [500, 350], [380, 100], [380, 250], [380, 400],
      [250, 200], [250, 300],
    ];

    for (const [x, y] of awayPositions) {
      const player = this.add.circle(x, y, 10, 0xdc2626);
      player.setStrokeStyle(2, 0xffffff);
      this.players.push(player);
    }
  }

  private createBall() {
    this.ball = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 6, 0xffffff);
    this.ball.setStrokeStyle(1, 0x000000);
  }

  private startMatchTimer() {
    // Match lasts ~3 minutes real time (90 minutes game time)
    this.timerEvent = this.time.addEvent({
      delay: 2000, // 2 seconds per game minute
      callback: () => {
        this.matchMinute++;
        this.animatePlay();
        if (this.matchMinute >= 90) {
          this.endMatch();
        }
      },
      loop: true,
    });

    // Display minute
    this.add.text(GAME_WIDTH / 2, 10, '', {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5, 0).setName('minuteText');
  }

  private animatePlay() {
    // Simple ball movement animation
    const targetX = Phaser.Math.Between(100, GAME_WIDTH - 100);
    const targetY = Phaser.Math.Between(60, GAME_HEIGHT - 60);

    this.tweens.add({
      targets: this.ball,
      x: targetX,
      y: targetY,
      duration: 1500,
      ease: 'Sine.easeInOut',
    });

    // Update minute display
    const text = this.children.getByName('minuteText') as Phaser.GameObjects.Text;
    if (text) {
      text.setText(`${this.matchMinute}'`);
    }
  }

  private endMatch() {
    this.timerEvent.destroy();
    // Emit match end event
    this.game.events.emit('matchEnd', { minute: 90 });
  }
}
