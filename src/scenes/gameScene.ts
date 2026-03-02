import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Obstacle } from '../entities/Obstacle';
import { supabase } from '../lib/supabase';

function getGameConfig() {
    const params = new URLSearchParams(window.location.search);

    const matchId = params.get('matchId');
    const userId = params.get('userId');

    console.log('Datos recibidos de la web:', { matchId, userId });

    return { matchId, userId };
}

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private sky!: Phaser.GameObjects.TileSprite;
    //private mountains!: Phaser.GameObjects.TileSprite;
    private ground!: Phaser.GameObjects.TileSprite;
    
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private isGameOver: boolean = false; // <-- NUEVO

    private obstacles!: Phaser.Physics.Arcade.Group;
    private nextSpawnTime: number = 0;

    private matchId: string | null = null;
    private userId: string | null = null;

    constructor() {
        super('GameScene');
    }

    init(data?: { matchId?: string, userId?: string }) {
        const urlConfig = getGameConfig();
        this.matchId = data?.matchId ?? urlConfig.matchId;
        this.userId = data?.userId ?? urlConfig.userId;
        console.log('Iniciando partida:', this.matchId, 'Usuario:', this.userId);
    }

    preload() {
        // Usamos assets de ejemplo de Phaser Labs para el fondo
        this.load.image('sky', 'assets/space.png');
        //this.load.image('mountains', 'assets/mountains.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('obstacle', 'assets/obstacle.png');
        this.load.spritesheet('player', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
        this.score = 0; // Reiniciamos el score al iniciar la escena
    }

    create() {
        // 1. Capas de fondo (Parallax)
        // El cielo se mueve casi imperceptiblemente
        this.sky = this.add.tileSprite(400, 300, 800, 600, 'sky').setScrollFactor(0);
        
        // Las montañas a media distancia
        //this.mountains = this.add.tileSprite(400, 450, 800, 300, 'mountains').setAlpha(0.5);

        // 2. Suelo (La capa más rápida)
        this.ground = this.add.tileSprite(400, 580, 800, 40, 'ground');
        this.physics.add.existing(this.ground, true);

        // 3. Jugador
        this.player = new Player(this, 150, 450);

        // 4. Grupo de obstáculos
        this.obstacles = this.physics.add.group({
            classType: Obstacle,
            runChildUpdate: true // Esto hace que se ejecute el update() de cada obstáculo
        });

        // 5. Colisión de muerte
        this.physics.add.collider(this.player, this.obstacles, () => {
            this.handleGameOver();
        });

        // Colisiones
        this.physics.add.collider(this.player, this.ground);

        // UI
        this.scoreText = this.add.text(16, 16, 'Score: 0', { 
            fontSize: '32px', 
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.isGameOver = false; // <-- NUEVO
    }

    update() {
        if (this.isGameOver) return; // <-- NUEVO: congela lógica y score

        // Actualizar lógica del jugador
        this.player.update();

        // 4. Efecto Parallax basado en speed
        const speed = this.player.currentSpeed / 60;

        this.sky.tilePositionX += speed * 0.1;       // Muy lento
        //this.mountains.tilePositionX += speed * 0.5; // Velocidad media
        this.ground.tilePositionX += speed;          // Velocidad real

        // Puntuación
        this.score += speed / 10;
        this.scoreText.setText(`Score: ${Math.floor(this.score)}`);

        // 3. Lógica de Spawning
        if (this.time.now > this.nextSpawnTime) {
            this.spawnObstacle();
            // El tiempo de espera baja a medida que el jugador va más rápido
            const spawnDelay = Phaser.Math.Between(1000, 3000) / (this.player.currentSpeed / 250);
            this.nextSpawnTime = this.time.now + spawnDelay;
        }

        // Actualizamos los obstáculos manualmente pasando la velocidad
        this.obstacles.getChildren().forEach((obs: any) => {
            obs.move(speed);
        });
    }

    spawnObstacle() {

      const x = 900;
      const groundY = 540; // Altura base de suelo para obstáculos
      const y = Phaser.Math.Between(0, 1) === 0 ? groundY : groundY - 50;
      
      // Usamos la nueva textura 'obstacle'
      const obstacle = new Obstacle(this, x, y, 'obstacle'); 
      
      // Forzamos un tamaño justo para que el salto sea posible
      obstacle.setDisplaySize(50, 50); 
      
      this.obstacles.add(obstacle);
    }

    async handleGameOver() {
        if (this.isGameOver) return; // <-- NUEVO: evita doble ejecución
        this.isGameOver = true;      // <-- NUEVO

        this.physics.pause();
        this.player.setTint(0xff0000);
        this.player.anims.stop();

        const finalScore = Math.floor(this.score); // <-- usar score actual (sin resetear)
        this.scoreText.setText(`Score: ${finalScore}`); // <-- opcional: fijar texto final

        if (!this.matchId || !this.userId) {
            console.warn('No hay matchId/userId; se omite guardado en DB.');
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', {
                    score: finalScore,
                    matchId: this.matchId,
                    userId: this.userId
                });
            });
            return;
        }

        try {
            await supabase.rpc('register_final_result', {
                p_match_id: this.matchId,
                p_winner_id: this.userId,
                p_score_p1: finalScore,
                p_points_delta: 10 
            });
            console.log("Resultado guardado en DB");
            console.log("Match ID:", this.matchId, "User ID:", this.userId, "Score:", finalScore);
        } catch (e) {
            console.error("Error al guardar:", e);
        }

        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene', {
                score: finalScore,
                matchId: this.matchId,
                userId: this.userId
            });
        });
    }
}



