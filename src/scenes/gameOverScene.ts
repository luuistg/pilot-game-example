import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
    private finalScore: number = 0;

    constructor() {
        super('GameOverScene');
    }

    // El método init permite recibir datos de la escena anterior
    init(data: { score: number }) {
        this.finalScore = data.score;
    }

    create() {
        // Fondo oscuro para resaltar el texto
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);

        this.add.text(400, 200, '¡PARTIDA TERMINADA!', {
            fontSize: '48px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(400, 300, `Puntuación Final: ${Math.floor(this.finalScore)}`, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const retryBtn = this.add.text(400, 450, 'REPETIR', {
            fontSize: '28px',
            backgroundColor: '#00aa00',
            padding: { x: 20, y: 10 },
            color: '#ffffff'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Al pulsar repetir, volvemos a la GameScene
        retryBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Botón opcional para ir al menú principal
        const menuBtn = this.add.text(400, 520, 'VOLVER AL MENÚ', {
            fontSize: '20px',
            color: '#aaaaaa'
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
}