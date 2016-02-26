/**
 * @const {number} Column number of map.
 */
var MAP_COLUMN_NUMBER = 5;


/**
 * @const {number} Column number of map.
 */
var MAP_ROW_NUMBER = 6;


/**
 * @const {number} Column length of map.
 */
var MAP_COLUMN_LENGTH = 100;


/**
 * @const {number} Row length of map.
 */
var MAP_ROW_LENGTH = 83;


/**
 * @param {number} x
 * @return {number} The pixel offset of the x'th block in the row.
 */
function pixelX(x) {
    return x * MAP_COLUMN_LENGTH;
}


/**
 * @param {number} min
 * @param {number} max
 * @return {number} Return an integer in range of [min, max).
 */
function randomN(min, max) {
    return Math.round(Math.random() * 1000) % (max - min) + min;
}


/**
 * @param {number} x
 * @return {number} The pixel offset of the x'th block in the row.
 */
function pixelY(y) {
    // offset "20" is for rendering icon properly in chrome.
    return y * MAP_ROW_LENGTH - 20;
}


/**
 * Inherits |childCtor| from |parentCtor|. It should be called immediately after
 * the definition of |childCtor|.
 * @param {Function} childCtor
 * @param {Function} parentCtor
 */
function inherits(childCtor, parentCtor) {
    childCtor.prototype = Object.create(parentCtor.prototype);
    childCtor.prototype.constructor = childCtor;
}



/**
 * Basic game item, which takes place of a block in the map. It contains the
 * position information, and some basic functions for rendering and updating.
 * @constructor
 * @param {number} x X of coordinate.
 * @param {number} y Y of coordinate.
 * @param {string} sprite Sprite of the item.
 */
var Item = function(x, y, sprite) {
    /** @type {number} */
    this.x = x;
    /** @type {number} */
    this.y = y;
    /** @type {string} */
    this.sprite = sprite;
};


/**
 * Draw the enemy on the screen, required method for game.
 */
Item.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), pixelX(this.x), pixelY(this.y));
};


/**
 * Update the position, if the position information has already updated
 * else where, you don't need to anything here but call render directly.
 * @param {number} dt A time delta between ticks.
 */
Item.prototype.update = function(dt) {
    this.render();
};


/**
 * @constructor
 * @extends {Item}
 * @param {number} x
 * @param {number} y
 * @param {string} sprite Sprite of gem.
 * @param {int} score
 * Create a gem in position (x, y). Player could get |score| after eating it.
 */
var Gem = function(x, y, sprite, score) {
    Item.call(this, x, y, sprite);
    /** @type {number} Score of gem. */
    this.score = score;
};
inherits(Gem, Item);


/**
 * An array of |cnt| gems, with a set of functions for easily adding/removing.
 * @constructor
 * @param {number} cnt
 */
var Gems = function(cnt) {
    /**
     * @type {number} Count of maintained gems.
     */
    this.cnt = cnt;

    /**
     * @type {Array.<Gem>}
     */
    this.gems = [];
    this.fulfillGems(this.cnt);
};


/**
 * Remove gem if it is in (x, y), and return the removed gem. If a gem is
 * removed, a new gem in different position will be created.
 * @param {number} x
 * @param {number} y
 * @return {Gem} Removed gem. Return null if no gem is removed.
 */
Gems.prototype.removeGemIfInPosition = function(x, y) {
    var idx = this.gems.findIndex(function(gem) {
        return gem.x == x && gem.y == y;
    });
    if (idx < 0) {
        return null;
    }
    // Create gem first, so it would in the same position of all existing gems,
    // including the one which is going to be removed.
    this.fulfillGems(this.cnt + 1);
    return this.gems.splice(idx, 1)[0];
};


/**
 * Create a new random gem.
 * @return {Gem} Created gem.
 */
Gems.prototype.createGem = function() {
    var gemType = [
        {score: 300, sprite: 'images/gem-blue.png'},
        {score: 200, sprite: 'images/gem-green.png'},
        {score: 100, sprite: 'images/gem-orange.png'},
    ];

    var type = gemType[randomN(0, gemType.length)];
    var x = randomN(0, MAP_COLUMN_NUMBER);
    var y = randomN(1, MAP_ROW_NUMBER);
    return new Gem(x, y, type.sprite, type.score);
};


/**
 * Fulfill this.gems until it contains |cnt| gems.
 * @param {number} cnt
 */
Gems.prototype.fulfillGems = function(cnt) {
    while (this.gems.length < cnt) {
        var newGem = this.createGem();
        // Add new gem into array if it is not overlapped with any existing gem.
        if (!this.gems.find(
            function(gem) { return gem.x == newGem.x && gem.y == newGem.y})) {
            this.gems.push(newGem);
        }
    }
};
var allGems = new Gems(2);


/**
 * @constructor
 * @extends {Item}
 * Player of the game.
 */
var Player = function() {
    // The initial position is (2, 4).
    Item.call(this, 2, 4, 'images/char-boy.png');

    /**
     * @type {number} Score of player.
     */
    this.score = 0;
};
inherits(Player, Item);


/**
 * Reset player position.
 */
Player.prototype.reset = function() {
    this.x = 2;
    this.y = 4;
    this.score = 0;
};


/**
 * Moves player to new position (x + dx, y + dy). The movement is ignored if new
 * position is invalid.
 * @param {number} dx
 * @param {number} dy
 */
Player.prototype.move = function(dx, dy) {
    var nx = this.x + dx;
    var ny = this.y + dy;
    // Check if new position is valid.
    if (nx < 0 || nx >= MAP_COLUMN_NUMBER ||
        ny < 0 || ny >= MAP_ROW_NUMBER) {
        return;
    }
    if (this.y < 1) {
        // Drop into river.
        this.reset();
        return;
    }
    this.x = nx;
    this.y = ny;
    this.tryEatGem();
};


/**
 * @param {number} Eat gem if any in current position.
 */
Player.prototype.tryEatGem = function() {
    var gem = allGems.removeGemIfInPosition(this.x, this.y);
    if (gem) {
        window.console.log(gem);
        this.score += gem.score;
    }
};


/**
 * @param {string} direction
 */
Player.prototype.handleInput = function(direction) {
    switch (direction) {
        case 'left':
            this.move(-1, 0);
            break;
        case 'up':
            this.move(0, -1);
            break;
        case 'right':
            this.move(1, 0);
            break;
        case 'down':
            this.move(0, 1);
            break;
        default:
    }
};
var player = new Player();



/**
 * @constructor
 * Dashboard shows players' score.
 */
var Dashboard = function() {
};


/**
 * Show score in the bottom right side.
 */
Dashboard.prototype.render = function() {
    ctx.font = '20px serif';
    ctx.fillText('Score: ' + player.score, pixelX(MAP_COLUMN_NUMBER - 1),
        pixelY(MAP_ROW_NUMBER + 1.1));
};
var dashboard = new Dashboard();



/**
 * @constructor
 * Enemies our player must avoid
 * @param {number} row The row that this empty should stay on.
 * @param {number} speed The speed of an Enemy. It should be an integer larger
 *     than 0.
 */
var Enemy = function(row, speed) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';

    /**
     * @type {number} pixel X of enemy's coordinate. An enemy will start to run
     * from left to right.
     */
    this.pixelX = 0;

    /**
     * @type {number} X of enemy's coordinate. It should keep constant as the
     * enemy could only move horizontally.
     */
    this.y = row;

    /**
     * @type {number} speed Speed of enemy.
     */
    this.speed = speed;
};


/**
 * @const {number} The pixel size of enemy's movement per second. For example,
 * an enemy with speed 3 (new Enemy(1, 3)) should move 3 * Enemy.PACE per
 * second.
 */
Enemy.PACE = 20;


/**
 * @const {number} Max X of enemy's coordinate. It should be 1 block wider than
 * map width, because we need to make sure its whole body disappeared before
 * resetting its position.
 */
Enemy.MAX_PIXEL_X = pixelX(MAP_COLUMN_NUMBER + 1);


/**
 * @return {number} Return a random row number in the range of [1, 3].
 */
Enemy.randomRow = function() {
    return randomN(1, 4);
};


// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks.
Enemy.prototype.update = function(dt) {
    var nx = this.pixelX + dt * this.speed * Enemy.PACE;
    if (nx >= Enemy.MAX_PIXEL_X) {
        this.y = Enemy.randomRow();
        nx -= Enemy.MAX_PIXEL_X;
    }
    this.pixelX = nx;
    if (this.hitPlayer()) {
        player.reset();
    }
};


// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.pixelX, pixelY(this.y));
};


/**
 * @return {boolean} If hit player
 */
Enemy.prototype.hitPlayer = function() {
    // The player icon is smaller than the block size visually, so we slightly
    // adjust the player size(0.8 * blockWidth) to make it more real.
    var playerLeft = pixelX(player.x + 0.1);
    var playerRight = pixelX(player.x + 0.9);

    var left = this.pixelX;
    var right = this.pixelX + pixelX(0.9);
    var hit = (playerLeft <= right && playerRight >= left) &&
        player.y == this.y;
    if (hit) {
        // For debugging.
        window.console.log(playerLeft + ',' + this.pixelX + ','
            + playerRight + '],[' + this.y + ','+ player.y + ']');
    }
    return hit;
};


// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = function(cnt) {
    var enemies = [];
    for (var i = 0; i < cnt; i++) {
        enemies.push(new Enemy(Enemy.randomRow(), randomN(1, 10)));
    }
    window.console.log(enemies);
    return enemies;
}(5);


// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});
