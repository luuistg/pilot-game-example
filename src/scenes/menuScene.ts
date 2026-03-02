import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    private externalData: { matchId: string | null; userId: string | null } = {
        matchId: null,
        userId: null
    };

    constructor() {
        super('MenuScene');
    }

    init() {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('player');
        this.externalData = {
            matchId: params.get('matchId'),
            userId
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