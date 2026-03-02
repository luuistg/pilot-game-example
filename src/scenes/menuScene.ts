import Phaser from 'phaser';
import { supabase } from '../lib/supabase';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
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

        startButton.on('pointerdown', async () => {
            // Deshabilitar el botón para evitar múltiples clics
            startButton.disableInteractive();
            startButton.setText('LOADING...');

            this.scene.start('GameScene'); // Iniciamos la escena del juego sin pasar datos por ahora
            
            // Llamamos a la función que crea el match en Supabase
            //await this.startNewGame(); 
        });
    }

    async startNewGame() {
    // 1. Obtenemos el usuario logueado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert("Debes estar logueado");
        return;
    }

    // 2. Creamos la partida en la tabla 'matches'
    const { data: match, error } = await supabase
        .from('matches')
        .insert({
            game_id: '61d7df63-b81d-4139-9345-3b104752d2cd', // El UUID de tu tabla 'games'
            player_1: user.id,         // FK a profiles
            status: 'in_progress'
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating match:", error);
        return;
    }

    if (match) {
        // 3. PASAR DATOS: Los enviamos como un objeto en el segundo parámetro
        this.scene.start('GameScene', { 
            matchId: match.id, 
            userId: user.id
        });
    }
}
}