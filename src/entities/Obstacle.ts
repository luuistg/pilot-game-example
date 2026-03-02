import Phaser from 'phaser';

export class Obstacle extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Accedemos al body casteándolo a Arcade.Body para poder modificar allowGravity
        const body = this.body as Phaser.Physics.Arcade.Body;
        
        if (body) {
            body.allowGravity = false; // Ahora ya te dejará escribir
            body.setImmovable(true);
        }
        
        this.setBodySize(this.width * 0.8, this.height * 0.8);
    }

    public move(speed: number) {
        // Usamos speed directamente (que ya viene dividida por 60 desde el main)
        // Multiplicar por 60 aquí lo haría demasiado rápido si ya lo haces fuera
        this.setVelocityX(-speed * 60);

        if (this.x < -100) {
            this.destroy(); 
        }
    }
}