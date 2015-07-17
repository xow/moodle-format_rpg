var TILESX = 20,
    TILESY = 20,
    TILESW = 32,
    TILESH = 32;

var walkables = [183, 181, 178];

var game = new Phaser.Game(TILESX * TILESW, TILESY * TILESH, Phaser.AUTO, 'container', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

var player,
    mapName = 'world1layer1',
    currentMap,
    tilemap,
    layer,
    warps,
    npcs = [];

function preload() {
    game.load.spritesheet('dude', 'format/rpg/assets/dude.png', 32, 48);
    game.load.spritesheet('warp', 'format/rpg/assets/diamond.png', 32, 28);
    game.load.spritesheet('Dog', 'format/rpg/assets/baddie.png', 32, 32);
    game.load.spritesheet('Goblin', 'format/rpg/assets/goblinsword_0.png', 64, 64);
    game.load.tilemap('map1', 'format/rpg/assets/tilemaps/maps/map1.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('terrain_atlas_image', 'format/rpg/assets/tilemaps/maps/terrain_atlas.png');
}

function create() {
    var sprite;
    game.physics.startSystem(Phaser.Physics.ARCADE);

    tilemap = game.add.tilemap('map1');
    tilemap.addTilesetImage('terrain_atlas', 'terrain_atlas_image');

    warps = game.add.group();
    warps.enableBody = true;
    for (var i = 0; i < 4; i++) {
        var warp = warps.create(0, 0, 'warp');
        warp.kill();
    }

    sprite = game.add.sprite(128, 128, 'dude');
    game.physics.arcade.enable(sprite);
    sprite.anchor.set(0.5, 0.5);
    sprite.body.collideWorldBounds = true;
    sprite.animations.add('left', [0, 1, 2, 3], 10, true);
    sprite.animations.add('right', [5, 6, 7, 8], 10, true);
    sprite.frame = 4;
    player = new Player(sprite);
    game.camera.follow(player.sprite);

    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    game.scale.setScreenSize(true);
}

function update() {
    var i;
    if (currentMap != mapName) {
        // We're teleporting. Change what layer is displayed
        game.world.remove(layer);
        layer = tilemap.createLayer(mapName);
        layer.resizeWorld();
        game.world.sendToBack(layer);
        tilemap.setCollisionByExclusion(walkables, true, layer);
        layerProperties = layer.layer.properties;

        // TODO Destroy all the elements from the previous map, memory leaks!!
        for (i = 0; i < npcs.length; i++) {
            npcs[i].destroy();
            delete npcs[i];
        }

        // New map transition
        //console.log(tilemap.layers);
        if (tilemap.layers.length > 0) {
            //tilemap.layers[tilemap.currentLayer].destroy();
            //layer = tilemap.createLayer('world2layer1');;
            //layer = tilemap.createLayer('world2layer1');
        }

        for (i = 0; i < 4; i++) {
            var warp = warps.getAt(i),
                infos = layerProperties.warps[i];

            if (infos) {
                warp.x = infos.x * TILESW;
                warp.y = infos.y * TILESH;
                // TODO Store the information somewhere else than in the sprite.
                warp.to = infos.to;
                warp.revive();
            } else {
                warp.kill();
            }
        }

        npcs = [];
        if (layerProperties.npcs) {
            for (i = 0; i < layerProperties.npcs.length; i++) {
                var s = layerProperties.npcs[i].type;
                npcs.push(new window[s](layerProperties.npcs[i]));
            }
        }

        currentMap = mapName;
        return;
    }

    if (game.input.activePointer.isDown) {
        // TODO Not store destination here.
        var clear = true,
            x = game.input.activePointer.worldX,
            y = game.input.activePointer.worldY;
        for (i = 0; i < npcs.length; i++) {
            if (npcs[0].sprite.body.hitTest(x, y)) {
                clear = false;
                break;
            }
        }

        if (clear) {
            player.moveToXY(layer.getTileX(x), layer.getTileX(y));
        }

        // game.physics.arcade.moveToXY(player, player.dest[0], player.dest[1], 200);
        // console.log(tilemap);
        // console.log(tilemap.getTileWorldXY(this.game.input.activePointer.x, this.game.input.activePointer.y));
        // player.x = this.game.input.activePointer.x - Math.floor(player.width / 2);
        // player.y = this.game.input.activePointer.y - Math.floor(player.height / 2);
    }

    game.physics.arcade.overlap(player.sprite, warps, warpOverlap, null, this);
    player.update();
    for (i = 0; i < npcs.length; i++) {
        game.physics.arcade.collide(npcs[i].sprite, player.sprite);
        npcs[i].update();
    }
}

function render() {
}

function warpOverlap(player, warp) {
    mapName = warp.to;
}

function Character(sprite) {
    this.sprite = sprite;
    this.x = 0;
    this.y = 0;
    this.origin = {x: this.x, y: this.y};
    this.destination = {x: this.x, y: this.y};
    this.angle = 0;
}
Character.prototype.destroy = function() {
    this.sprite.destroy();
};
Character.prototype.isMoving = function() {
    return !Phaser.Point.equals(this.sprite.body.velocity, new Phaser.Point(0,0));
};
Character.prototype.jumpToXY = function(x, y) {
    this.origin = {x: this.x, y: this.y};
    this.destination = {x: x, y: y};
    this.angle = 0;
    this.x = x;
    this.y = y;
    this.sprite.x = x * TILESW;
    this.sprite.y = y * TILESH;
};
Character.prototype.moveToXY = function(x, y) {
    this.origin = {x: this.x, y: this.y};
    this.destination = {x: x, y: y};
    this.angle = game.physics.arcade.moveToXY(this.sprite, x * TILESW, y * TILESH, 200);
};
Character.prototype.stop = function() {
    this.sprite.x = this.x * TILESW;
    this.sprite.y = this.y * TILESH;
    this.sprite.body.velocity.setTo(0, 0);
    this.sprite.animations.stop();
};
Character.prototype.update = function() {
    if (this.sprite.body.speed > 0) {
        var stopCondition,
            x = this.sprite.x,
            y = this.sprite.y,
            destX = this.destination.x * TILESW,
            destY = this.destination.y * TILESH;

        this.x = Math.round(x / TILESW);
        this.y = Math.round(y / TILESH);

        if (this.angle >= 0 && this.angle < Math.PI/2) {
            // Going bottom right.
            stopCondition = x >= destX && y >= destY;
            this.sprite.animations.play('right');
        } else if (this.angle >= Math.PI/2) {
            // Going bottom left.
            stopCondition = x <= destX && y >= destY;
            this.sprite.animations.play('left');
        } else if (this.angle >= -Math.PI && this.angle < -Math.PI/2) {
            // Going top left.
            stopCondition = x <= destX && y <= destY;
            this.sprite.animations.play('left');
        } else {
            // Going top right.
            stopCondition = x >= destX && y <= destY;
            this.sprite.animations.play('right');
        }

        if (stopCondition) {
            this.x = this.destination.x;
            this.y = this.destination.y;
            this.stop();
        } else {
            this.angle = game.physics.arcade.moveToXY(this.sprite, this.destination.x * TILESW, this.destination.y * TILESH, 200);
        }
    }
    game.physics.arcade.collide(this.sprite, layer);
};

function Player() {
    Character.apply(this, arguments);
}
Player.prototype = Object.create(Character.prototype);
Player.prototype.constructor = Player;
Player.prototype.stop = function() {
    Character.prototype.stop.apply(this, arguments);
    this.sprite.frame = 4;
};

function NPC(infos) {
    // TODO Handle different types of NPCs somehow, probably somewhere else.
    var sprite = game.add.sprite(0, 0, infos.type);
    Character.apply(this, [sprite]);

    sprite.kill();
    game.physics.arcade.enable(sprite);
    sprite.body.collideWorldBounds = true;
    sprite.animations.add('left', [0, 1], 10, true);
    sprite.animations.add('right', [2, 3], 10, true);
    sprite.frame = 1;
    sprite.body.immovable = true;
    sprite.anchor.set(0.5, 0.5);

    this.infos = infos;
    this.jumpToXY(infos.x, infos.y);
    sprite.revive();

    sprite.inputEnabled = true;
    sprite.events.onInputUp.add(this.interact, this);
    this.text = null;
}
NPC.prototype = Object.create(Character.prototype);
NPC.prototype.constructor = NPC;
NPC.prototype.interact = function() {
    if (this.infos.speech) {
        this.say(this.infos.speech);
    } else {
        this.say('*poke*');
    }
};
NPC.prototype.say = function(str) {
    var x,
        y;

    if (this.text) {
        this.text.destroy();
    }

    x = this.sprite.x;
    y = this.sprite.y - 10;
    this.text = game.add.text(x, y, str, {
        wordWrap: true,
        wordWrapWidth: 200,
        strokeThickness: 2,
        fontSize: 12,
        fill: '#ffffff'
    });
    this.text.anchor.set(0.5, 1);
    this.text.lifespan = 1000;
};
NPC.prototype.stop = function() {
    Character.prototype.stop.apply(this, arguments);
    this.sprite.frame = 1;
};
NPC.prototype.update = function() {
    Character.prototype.update.apply(this, arguments);
};

function Dog(infos) {
    NPC.apply(this, [infos]);
}
Dog.prototype = Object.create(NPC.prototype);

function Goblin(infos) {
    NPC.apply(this, [infos]);
    this.sprite.animations.add('left', [38, 37, 36, 35, 34, 33], 10, true);
    this.sprite.animations.add('right', [11, 12, 13, 14, 15, 16], 10, true);
    this.sprite.frame = 1;
    this.sprite.body.immovable = true;
}
Goblin.prototype = Object.create(NPC.prototype);
Goblin.prototype.constructor = NPC;
Goblin.prototype.update = function() {
    NPC.prototype.update.apply(this, arguments);
    if (!this.isMoving()) {
        if (this.x == 1) {
            this.moveToXY(this.infos.x, this.infos.y);
        } else {
            this.moveToXY(this.infos.walkx, this.infos.walky);
        }
    }
};