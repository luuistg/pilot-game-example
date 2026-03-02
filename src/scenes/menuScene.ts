import Phaser from 'phaser';
import { getLaunchContextFromUrl } from '../lib/gamePlatform';

export class MenuScene extends Phaser.Scene {
    private externalData: { gameId: string | null; matchId: string | null; userId: string | null; player2Id: string | null } = {
        gameId: null,
        matchId: null,
        userId: null,
        player2Id: null
    };

    constructor() {
        super('MenuScene');
    }

    init() {
        const context = getLaunchContextFromUrl();
        this.externalData = {
            gameId: context.gameId,
            matchId: context.matchId,
            userId: context.playerId,
            player2Id: context.player2Id
        };

        console.log('Datos recibidos desde React:', this.externalData);
    }

    preload() {
        this.load.image('background', 'assets/space.png');
    }

    create() {
        this.add.image(400, 300, 'background');
        
        this.add.text(400, 200, 'PILOT ADVENTURE', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const startButton = this.add.text(400, 400, 'CLICK TO START', {
            fontSize: '32px',
            color: '#00ff00',
            backgroundColor: '#00000099',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            startButton.disableInteractive();

            this.scene.start('GameScene', this.externalData);
        });
    }
}