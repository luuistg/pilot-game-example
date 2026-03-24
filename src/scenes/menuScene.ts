import Phaser from 'phaser';
import { getLaunchContextFromUrl, createMatch, submitGameResult, updatePlayerScore } from 'm4g-sdk';

export class MenuScene extends Phaser.Scene {
    private externalData: { gameId: string | null; matchId: string | null; userId: string | null } = {
        gameId: null,
        matchId: null,
        userId: null
    };

    constructor() {
        super('MenuScene');
    }

    async init() {
        // Mostrar la URL actual para depuración
        console.log('URL actual:', window.location.href);
        // Recuperar parámetros de la URL usando el SDK

        const ctx = getLaunchContextFromUrl();
        this.externalData = {
            gameId: ctx.gameId,
            matchId: ctx.matchId,
            userId: ctx.playerId
        };

        // Crear partida si no existe matchId
        if (!this.externalData.matchId && this.externalData.gameId && this.externalData.userId) {
            const result = await createMatch({
                gameId: this.externalData.gameId,
                player1: this.externalData.userId,
                player2: '' // Provide an empty string or a valid player2 id as required
            });
            if (result.ok) {
                this.externalData.matchId = result.matchId ?? null;
                console.log('Partida creada, matchId:', result.matchId);
            } else {
                console.error('Error creando partida:', result.error);
            }
        }

        // Insertar resultado inicial en la base de datos (score 0)
        if (this.externalData.matchId && this.externalData.userId) {
            const insertResult = await submitGameResult({
                matchId: this.externalData.matchId,
                playerId: this.externalData.userId,
                score: 0,
                gameMode: 'sp'
            });
            if (insertResult.ok) {
                console.log('Resultado inicial insertado');
            } else {
                console.error('Error insertando resultado inicial:', insertResult.error);
            }
        }

        // Enviar score inicial (0)
        if (this.externalData.gameId && this.externalData.userId) {
            await updatePlayerScore({
                userId: this.externalData.userId,
                gameId: this.externalData.gameId,
                score: 0
            });
        }

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