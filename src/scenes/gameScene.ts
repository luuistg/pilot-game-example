import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { supabase } from '../lib/supabase';

// Utilidad externa para limpiar el componente
const getURLData = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        matchId: params.get('matchId'),
        userId: params.get('userId') ?? params.get('playerId') ?? params.get('player')
    };
};

const isUuid = (val: string | null) => 
    val ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val) : false;

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private sky!: Phaser.GameObjects.TileSprite;
    private ground!: Phaser.GameObjects.TileSprite;
    private scoreText!: Phaser.GameObjects.Text;
    private obstacles!: Phaser.Physics.Arcade.Group;
    
    private score: number = 0;
    private nextSpawnTime: number = 0;
    private isGameOver: boolean = false;
    private matchId: string | null = null;
    private userId: string | null = null;

    constructor() {
        super('GameScene');
    }

    init(data?: { matchId?: string, userId?: string }) {
        const urlData = getURLData();
        this.matchId = urlData.matchId ?? data?.matchId ?? null;
        this.userId = urlData.userId ?? data?.userId ?? null;
        this.isGameOver = false;
        this.score = 0;
        console.log('🎮 Sesión:', { matchId: this.matchId, userId: this.userId });
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

        // Guardado en Base de Datos
        if (isUuid(this.matchId) && isUuid(this.userId)) {
            try {
                const { error } = await supabase.rpc('register_final_result', {
                    p_match_id: this.matchId,
                    p_winner_id: this.userId,
                    p_score_p1: finalScore,
                    p_points_delta: 10
                });

                if (error) {
                    // Manejo silencioso de conflictos (409) si el resultado ya existe
                    if (error.code !== '23505') console.error('Error RPC:', error.message);
                } else {
                    console.log('✅ Resultado guardado');
                }
            } catch (e) {
                console.error('Error de red:', e);
            }
        } else {
            console.warn('⚠️ Guardado omitido: IDs faltantes o inválidos');
        }

        this.transitionToGameOver(finalScore);
    }

    private transitionToGameOver(score: number) {
        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene', {
                score,
                matchId: this.matchId,
                userId: this.userId
            });
        });
    }
}