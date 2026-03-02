import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { getLaunchContextFromUrl, submitGameResult } from '../lib/gamePlatform';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private sky!: Phaser.GameObjects.TileSprite;
    private ground!: Phaser.GameObjects.TileSprite;
    private scoreText!: Phaser.GameObjects.Text;
    private obstacles!: Phaser.Physics.Arcade.Group;
    
    private score: number = 0;
    private nextSpawnTime: number = 0;
    private isGameOver: boolean = false;
    private gameId: string | null = null;
    private matchId: string | null = null;
    private userId: string | null = null;
    private player2Id: string | null = null;

    constructor() {
        super('GameScene');
    }

    init(data?: { gameId?: string, matchId?: string, userId?: string, player2Id?: string }) {
        const launchContext = getLaunchContextFromUrl();
        this.gameId = launchContext.gameId ?? data?.gameId ?? null;
        this.matchId = launchContext.matchId ?? data?.matchId ?? null;
        this.userId = launchContext.playerId ?? data?.userId ?? null;
        this.player2Id = launchContext.player2Id ?? data?.player2Id ?? null;
        this.isGameOver = false;
        this.score = 0;
        console.log('Sesión:', { gameId: this.gameId, matchId: this.matchId, userId: this.userId, player2Id: this.player2Id });
    }

    preload() {
        this.load.image('sky', 'assets/space.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('obstacle', 'assets/obstacle.png');
        this.load.spritesheet('player', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create() {
        // Fondo y Suelo
        this.sky = this.add.tileSprite(400, 300, 800, 600, 'sky').setScrollFactor(0);
        this.ground = this.add.tileSprite(400, 580, 800, 40, 'ground');
        this.physics.add.existing(this.ground, true);

        // Entidades
        this.player = new Player(this, 150, 450);
        this.obstacles = this.physics.add.group({ classType: Obstacle, runChildUpdate: true });

        // Colisiones
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.obstacles, () => this.handleGameOver());

        // UI
        this.scoreText = this.add.text(16, 16, 'Score: 0', { 
            fontSize: '32px', fontStyle: 'bold', color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        });
    }

    update() {
        if (this.isGameOver) return;

        this.player.update();
        const speed = this.player.currentSpeed / 60;

        // Parallax y Puntuación
        this.sky.tilePositionX += speed * 0.1;
        this.ground.tilePositionX += speed;
        this.score += speed / 10;
        this.scoreText.setText(`Score: ${Math.floor(this.score)}`);

        // Spawn de obstáculos
        if (this.time.now > this.nextSpawnTime) {
            this.spawnObstacle();
            const delay = Phaser.Math.Between(1000, 3000) / (this.player.currentSpeed / 250);
            this.nextSpawnTime = this.time.now + delay;
        }

        this.obstacles.getChildren().forEach((obs: any) => obs.move(speed));
    }

    private spawnObstacle() {
        const x = 900;
        const groundY = 540;
        const y = Phaser.Math.Between(0, 1) === 0 ? groundY : groundY - 50;
        const obstacle = new Obstacle(this, x, y, 'obstacle'); 
        obstacle.setDisplaySize(50, 50); 
        this.obstacles.add(obstacle);
    }

    async handleGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        // Feedback visual inmediato
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.player.anims.stop();
        
        const finalScore = Math.floor(this.score);
        this.scoreText.setText(`Score: ${finalScore}`);

        // Guardado en Base de Datos mediante librería
        if (!this.matchId || !this.userId) {
            console.warn('⚠️ Guardado omitido: IDs faltantes o inválidos');
        } else {
            try {
                const result = await submitGameResult({
                    matchId: this.matchId,
                    playerId: this.userId,
                    score: finalScore
                });

                if (result.ok) {
                    console.log(`Resultado guardado vía ${result.source}${result.conflict ? ' (conflicto controlado)' : ''}`);
                } else {
                    console.error('No se pudo guardar resultado', result.error);
                }
            } catch (e) {
                console.error('Error de red/ejecución al guardar:', e);
            }
        }

        this.transitionToGameOver(finalScore);
    }

    private transitionToGameOver(score: number) {
        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene', {
                score,
                gameId: this.gameId,
                matchId: this.matchId,
                userId: this.userId
            });
        });
    }
}