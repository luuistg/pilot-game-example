import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    public currentSpeed: number = 200; 
    private maxSpeed: number = 1000;    
    private acceleration: number = 4; // Aumentado para que se note antes el cambio

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setGravityY(1200); // Gravedad un poco más pesada para mejor control
        
        // Crear animaciones si no existen
        this.createAnimations();

        // Inputs
        this.scene.input.keyboard?.on('keydown-SPACE', () => this.jump());
        this.scene.input.on('pointerdown', () => this.jump());
    }

    private createAnimations() {
        if (!this.anims.exists('run')) {
            this.anims.create({
                key: 'run',
                frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
                frameRate: 12,
                repeat: -1
            });
        }
        if (!this.anims.exists('jump')) {
            this.anims.create({
                key: 'jump',
                frames: [{ key: 'player', frame: 6 }],
                frameRate: 20
            });
        }
    }

    public update() {
        // Incremento de dificultad
        if (this.currentSpeed < this.maxSpeed) {
            this.currentSpeed += this.acceleration / 60; 
        }

        // Lógica de animaciones basada en estado físico
        if (!this.body?.touching.down) {
            this.play('jump', true);
        } else {
            this.play('run', true);
            // Ajustar la velocidad de la animación según la velocidad actual
            this.anims.timeScale = (1 + (this.currentSpeed / 1000));
        }
    }

    private jump() {
        if (this.body?.touching.down) {
            this.setVelocityY(-600);
        }
    }
}