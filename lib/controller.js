'use stric';

var logger = require('./logger');

var gameCounter = 0;
var games = {};

var Game = function(id) {
	this.id = id;
	this.player1 = null;
	this.player2 = null;
};

Game.prototype.joinPlayer = function(player) {
  var self = this;
  var playerNumber = 1;
  if (this.player1 === null) {
    this.player1 = player;
  } else {
    // TODO, player 2 gets overwritten for every new player that joins.
    // Handle this situation.
    this.player2 = player;
    playerNumber = 2;

    // When second player connects, notify both player 1 and 2 that the
    // opponent has joined.
    this.player2.sendOpponentInfo(this.player1);
    this.player1.sendOpponentInfo(this.player2);
  }
  logger.info(
    '%s joined game %s as player %s', player.id, this.id, playerNumber);

  // Start listening for zombies from the player.
  player.socket.on('zombie', function(zombie) {
    logger.verbose('A zombie was added in game %s', self.id, zombie);

    // Notify the opponent of the added zombie.
    if (playerNumber === 1 && self.player2 !== null) {
      self.player2.socket.emit('zombie', zombie);
    } else if (playerNumber === 2 && self.player1 !== null) {
      self.player1.socket.emit('zombie', zombie);
    }
  });
};

/**
 * Represents a connection to a player client.
 */
var Player = function(socket) {
  // TODO: Deprecate this ID since it is unnecessary to store it.
  this.id = socket.id;
  this.socket = socket;
};

Player.prototype.toJSON = function() {
  return {
    id: this.id
  };
};

Player.prototype.sendPlayerInfo = function() {
  this.socket.emit('player', this.toJSON());
};

Player.prototype.sendOpponentInfo = function(opponent) {
  this.socket.emit('opponent', opponent.toJSON());
};

var createGame = function() {
	var gameId = gameCounter++;
	games[gameId] = new Game(gameId);
  return gameId;
};

var listenForJoin = function(socket) {
  socket.on('join', function(data) {
    var game = games[data.gameId];
    var player = new Player(socket);
    player.sendPlayerInfo();
    game.joinPlayer(player);
  });
};

var setupSocket = function(socket) {
  logger.info('A client connected.');
  listenForJoin(socket);

  socket.on('error', function(err) {
    logger.error(err);
  });
};

module.exports = {
  setupSocket: setupSocket,
  games: games,
  newGame: createGame
};