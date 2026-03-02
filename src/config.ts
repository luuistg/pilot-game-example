import Phaser from 'phaser';
import { MenuScene } from './scenes/menuScene';
import { GameScene } from './scenes/gameScene';
import { GameOverScene } from './scenes/gameOverScene';

export const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000000',
    physics: { 
        default: 'arcade', 
        arcade: { 
            gravity: { x: 0, y: 0 }, // La gravedad se define en el player
            debug: false 
        } 
    },
    scene: [MenuScene, GameScene, GameOverScene]
};