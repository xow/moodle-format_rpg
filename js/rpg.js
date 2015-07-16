var TILESX = 20,
    TILESY = 20,
    TILESW = 32,
    TILESH = 32;

var maps = {
    0: {
        id: 0,
        bg: '#454645',
        warps: [
            {
                to: 1,
                x: 10,
                y: 10
            }
        ]
    },
    1: {
        id: 1,
        bg: '#ff9900',
        warps: [
            {
                to: 2,
                x: 200,
                y: 200
            }
        ]
    },
    2: {
        id: 2,
        bg: '#ffff00',
        warps: [
            {
                to: 0,
                x: 400,
                y: 400
            }
        ]
    }
};

var game = new Phaser.Game(TILESX * TILESW, TILESY * TILESH, Phaser.AUTO, 'container', {
    preload: preload,
    create: create,
    update: update
});

var player,
    map = maps[0],
    currentMap,
    tilemap,
    layer,
    warps;

function preload() {
    game.load.spritesheet('dude', 'format/rpg/assets/dude.png', 32, 48);
    game.load.spritesheet('warp', 'format/rpg/assets/diamond.png', 32, 28);
    game.load.image('tiles', 'format/rpg/assets/tiles.png');
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    tilemap = game.add.tilemap();
    tilemap.addTilesetImage('tiles', 'tiles', 32, 32);
    layer = tilemap.create(null, TILESX, TILESY, TILESW, TILESH);
    tilemap.fill(5, 0, 0, TILESX, TILESY, layer);

    warps = game.add.group();
    warps.enableBody = true;
    for (var i = 0; i < 4; i++) {
        var warp = warps.create(0, 0, 'warp');
        warp.kill();
    }

    player = new Player();
}

function update() {
    if (currentMap != map) {
        // New map transition
        game.stage.backgroundColor = map.bg;

        for (i = 0; i < 4; i++) {
            var warp = warps.getAt(i),
                infos = map.warps[i];

            if (infos) {
                warp.x = infos.x;
                warp.y = infos.y;
                // TODO Store the information somewhere else than in the sprite.
                warp.to = infos.to;
                warp.revive();
            } else {
                warp.kill();
            }
        }

        currentMap = map;
        return;
    }

    if (game.input.activePointer.isDown) {
        // TODO Not store destination here.
        player.moveToXY(layer.getTileX(game.input.activePointer.x), layer.getTileX(game.input.activePointer.y));

        // game.physics.arcade.moveToXY(player, player.dest[0], player.dest[1], 200);
        // console.log(tilemap);
        // console.log(tilemap.getTileWorldXY(this.game.input.activePointer.x, this.game.input.activePointer.y));
        // player.x = this.game.input.activePointer.x - Math.floor(player.width / 2);
        // player.y = this.game.input.activePointer.y - Math.floor(player.height / 2);
    }

    game.physics.arcade.overlap(player.sprite, warps, warpOverlap, null, this);
    player.update();
}

function warpOverlap(player, warp) {
    map = maps[warp.to];
}

function Player() {
    var sprite = game.add.sprite(32, game.world.height - 150, 'dude');
    game.physics.arcade.enable(sprite);
    sprite.body.collideWorldBounds = true;
    sprite.animations.add('left', [0, 1, 2, 3], 10, true);
    sprite.animations.add('right', [5, 6, 7, 8], 10, true);
    sprite.frame = 4;

    this.sprite = sprite;
    this.origin = {x: sprite.x, y: sprite.y};
    this.destination = {x: sprite.x, y: sprite.y};
    this.angle = 0;
}
Player.prototype.moveToXY = function(tileX, tileY) {
    var x = tileX * TILESW,
        y = tileY * TILESH;

    this.origin = {x: this.sprite.x, y: this.sprite.y};
    this.destination = {x: x, y: y};
    this.angle = game.physics.arcade.moveToXY(this.sprite, x, y, 200);
};
Player.prototype.update = function() {
    if (this.sprite.body.speed > 0) {
        var stopCondition,
            x = this.sprite.x,
            y = this.sprite.y;

        if (this.angle >= 0 && this.angle < Math.PI/2) {
            // Going bottom right.
            stopCondition = x >= this.destination.x && y >= this.destination.y;
            this.sprite.animations.play('right');
        } else if (this.angle >= Math.PI/2) {
            // Going bottom left.
            stopCondition = x <= this.destination.x && y >= this.destination.y;
            this.sprite.animations.play('left');
        } else if (this.angle >= -Math.PI && this.angle < -Math.PI/2) {
            // Going top left.
            stopCondition = x <= this.destination.x && y <= this.destination.y;
            this.sprite.animations.play('left');
        } else {
            // Going top right.
            stopCondition = x >= this.destination.x && y <= this.destination.y;
            this.sprite.animations.play('right');
        }

        if (stopCondition) {
            this.sprite.x = this.destination.x;
            this.sprite.y = this.destination.y;
            this.sprite.body.velocity.setTo(0, 0);

            this.sprite.animations.stop();
            this.sprite.frame = 4;
        }
    }
};
