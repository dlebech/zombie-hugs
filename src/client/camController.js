'use strict';

var camera = null;
var socket = null;
var isSpectator = false;

var CamController = function(cam, sock, direction) {
  // TODO: Consider using THREE.FirstPersonControls?

  camera = cam;
  socket = sock;

  // Currently, the absense of a socket object determines whether or not the
  // cam controller is a spectator.
  isSpectator = !sock;

  this.direction = direction;

  // Register the player for key events.
  var self = this;
  var startMoveEvent = function(keyEvent) {
    if (self.toggleMovement(keyEvent.keyCode, true) && socket) {
      console.log('Cam movement started', keyEvent.keyCode);
      socket.emit('move.start', keyEvent.keyCode);
    }
  };

  var endMoveEvent = function(keyEvent) {
    if (self.toggleMovement(keyEvent.keyCode, false) && socket) {
      console.log('Cam movement ended', keyEvent.keyCode);
      socket.emit('move.end', keyEvent.keyCode);
    }
  };

  var mouseClickEvent = function() {
    console.log('Click');
    self.fire();
  };

  window.addEventListener('keydown', startMoveEvent);
  window.addEventListener('keyup', endMoveEvent);
  window.addEventListener('click', mouseClickEvent);
};

CamController.prototype.toggleMovement = function(keyCode, directionBool) {
  var hasChanged = false;
  switch (keyCode) {
    case 37:  // Leftarrow
    case 65:  // a key
      hasChanged = this.left !== directionBool;
      this.left = directionBool;
      break;
    case 38:  // Up arrow
    case 87:  // w key
      hasChanged = this.forward !== directionBool;
      this.forward = directionBool;
      break;
    case 39:  // Right arrow
    case 68:  // d key
      hasChanged = this.right !== directionBool;
      this.right = directionBool;
      break;
    case 40:  // Down arrow
    case 83:  // s key
      hasChanged = this.backward !== directionBool;
      this.backward = directionBool;
      break;
  }
  return hasChanged;
};

CamController.prototype.fire = function() {
  if (socket) {
    socket.emit('fire', camera.position);
  }
};

CamController.prototype.update = function(elapsed) {
  // How much to move.
  var tr = 100.0;
  var curPosX = camera.position.x;

  // Spectators have full movement
  if (isSpectator) {

    // Because free movement is calculated differently, the position modifier
    // has to be much lower.
    tr = 5.0;

    var rot = 0.025;
    var curPosZ = camera.position.z;
    var curRot = camera.rotation.y;

    if (this.forward) {
      curPosX -= Math.sin(-curRot) * -tr;
      curPosZ -= Math.cos(-curRot) * tr;
    }
    else if (this.backward) {
      curPosX -= Math.sin(curRot) * -tr;
      curPosZ += Math.cos(curRot) * tr;
    }

    if (this.left) {
      curRot += rot;
    }
    else if (this.right) {
      curRot -= rot;
    }

    camera.position.x = curPosX;
    camera.position.z = curPosZ;
    camera.rotation.y = curRot;
    return;
  }

  // If the cam controller is a player, the player direction matters and we can
  // only move along the x-axis (at the edge of the battlefield).
  if (this.left) {
    curPosX -= tr*elapsed*this.direction;
  }
  else if (this.right) {
    curPosX += tr*elapsed*this.direction;
  }
  camera.position.x = curPosX;
};

module.exports = CamController;