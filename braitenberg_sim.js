/* Braitenberg vehicles
 * Agent and GUI script
 * Copyright 2016 Harmen de Weerd
 * 2021 Roy de Kleijn
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

braitenbergInfo = {
  vehicles: [
    {x: 200, y: 200, color: "red", angle: 0, baseValues: {left: 1, right: 1, bulb: 0}, sensors: [{position: -Math.PI/4, type: "right", strength: 1}, {position: Math.PI/4, type: "left", strength: 1}]},
    {x: 200, y: 200, color: "blue", angle: 0, baseValues: {left: 1, right: 1, bulb: 0}, sensors: [{position: -Math.PI/4, type: "right", strength: 1}, {position: Math.PI/4, type: "left", strength: 1}]},
    {x: 200, y: 200, color: "green", angle: 0, baseValues: {left: 1, right: 1, bulb: 0}, sensors: [{position: -Math.PI/4, type: "right", strength: 1}, {position: Math.PI/4, type: "left", strength: 1}]},
    {x: 200, y: 200, color: "orange", angle: 0, baseValues: {left: 1, right: 1, bulb: 0}, sensors: [{position: -Math.PI/4, type: "right", strength: 1}, {position: Math.PI/4, type: "left", strength: 1}]}],
  bulbs: [{x: 300, y: 200}, {x: 300, y: 50}, {x: 150, y: 300}, {x: 450, y: 300}]
};

simulationInfo = {
  doContinue: true,
  height: 400,
  width: 625,
  handle: 0,
  moveSpeed: 10,
  speedMultiplier: 5,
  vehicleSize: 15,
  bulbPower: 5,
  bulbSize: 6,
  shadowDistance: 22500,
  sensorColors: {left: "white", right: "black", bulb:"yellow"},
  bayVehicle: null,
  baySensor: null,
  lightIntensity: []
};
vehicles = new Array();
bulbs = new Array();
sensors = new Array();

function init() {
  var n;
  for (n = 0; n < simulationInfo.width; ++n) {
    simulationInfo.lightIntensity[n] = [];
  }
  simulationInfo.height = document.getElementById("arenaBraitenberg").height;
  simulationInfo.width = document.getElementById("arenaBraitenberg").width;
  addMouseTracker(document.getElementById("arenaBraitenberg"));
  addMouseTracker(document.getElementById("bayBraitenberg"));

  setBulbNumber(document.getElementById("bulbDial").value);
  setVehicleNumber(document.getElementById("vehicleDial").value);
  loadBay(vehicles[0]);
  step();
}

function dragSensor(agent, event) {
  var angle = Math.acos((55 - event.mouse.y) / Math.sqrt(Math.pow(event.mouse.x - 55,2) + Math.pow(event.mouse.y - 55,2)));
  agent.sensor.position = angle;
  if (event.mouse.x < 55) {
    agent.sensor.position *= -1;
  }
  agent.x = 52 - 3 * simulationInfo.vehicleSize * Math.sin(-agent.sensor.position);
  agent.y = 52 - 3 * simulationInfo.vehicleSize * Math.cos(agent.sensor.position);
  repaintBay();
}

function loadSensor(sensor, event) {
  loadSensorInfo(sensor.sensor);
  return true;
}

function loadSensorInfo(sensor) {
  simulationInfo.baySensor = sensor;
  switch (sensor.type) {
  case "left":
    document.getElementById("sensorTypeSelect").selectedIndex = 0;
    break;
  case "right":
    document.getElementById("sensorTypeSelect").selectedIndex = 1;
    break;
  case "bulb":
    document.getElementById("sensorTypeSelect").selectedIndex = 2;
    break;
  }
  document.getElementById("sensorStrengthDial").value = sensor.strength * 10;
  document.getElementById("sensorStrengthLabel").innerHTML = sensor.strength;
  return true;
}

function loadBay(agent) {
  var i, curSensor;
  simulationInfo.bayVehicle = agent;
  sensors = new Array();
  for (i = 0; i < agent.vehicle.sensors.length; ++i) {
    curSensor = agent.vehicle.sensors[i];
    sensors[i] = makeInteractiveElement(new SensorGraphics(curSensor), document.getElementById("bayBraitenberg"));
    sensors[i].x = 52 - 3 * simulationInfo.vehicleSize * Math.sin(-curSensor.position);
    sensors[i].y = 52 - 3 * simulationInfo.vehicleSize * Math.cos(curSensor.position);
    sensors[i].onDragging = dragSensor;
    sensors[i].onDrag = loadSensor;
  }
  document.getElementById("sensorDial").value = agent.vehicle.sensors.length;
  document.getElementById("sensorLabel").innerHTML = agent.vehicle.sensors.length;
  setLeftMotorValue(agent.vehicle.baseValues.left*10);
  setRightMotorValue(agent.vehicle.baseValues.right*10);
  setLightBulbValue(agent.vehicle.baseValues.bulb*100);
  loadSensorInfo(agent.vehicle.sensors[0]);
  repaintBay();
}

function BulbGraphics(bulb) {
  this.bulb = bulb;
  this.getColor = function() {
    return "#FFFFFF";
  };
  this.draw = function(ctx, xTopLeft = this.x, yTopLeft = this.y){
    ctx.beginPath();
    ctx.arc(xTopLeft + simulationInfo.bulbSize, yTopLeft + simulationInfo.bulbSize, simulationInfo.bulbSize, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fillStyle = this.getColor();
    ctx.fill();
    ctx.stroke();
  };
  this.getWidth = function() {
    return simulationInfo.bulbSize*2;
  };
  this.getHeight = function() {
    return simulationInfo.bulbSize*2;
  };
}

function SensorGraphics(sensor) {
  this.sensor = sensor;
  this.draw = plotSensor;
  this.getWidth = function() {
    return 6;
  };
  this.getHeight = function() {
    return 6;
  };
}

function VehicleGraphics(vehicle) {
  this.vehicle = vehicle;
  this.lightSize = 3;
  this.draw = plotVehicle;
  this.getWidth = function() {
    return 2 * simulationInfo.vehicleSize;
  };
  this.getHeight = function() {
    return 2 * simulationInfo.vehicleSize;
  };
  this.bulb = vehicle.baseValues.bulb;
}

function getBulbStrength(x, y) {
  if (x >= 0 && x < simulationInfo.width + 1 && y >= 0 && y < simulationInfo.height + 1) {
    return getSensorResponse(getPositionalLighting(Math.floor(x),Math.floor(y)));
  }
  return 0;
}

function squashSpeed(speed) {
  if (speed < 0) {
    return -Math.sqrt(-speed);
  }
  return Math.sqrt(speed);
}

function moveVehicle(vehicle) {
  var i, bulbStrength, speedL, speedR, radius, dAngle, newX, newY, stopMove, delta;
  if (!vehicle.isDragged) {
    speedL = vehicle.vehicle.baseValues.left;
    speedR = vehicle.vehicle.baseValues.right;
    vehicle.bulb = vehicle.vehicle.baseValues.bulb;
    for (i = 0; i < vehicle.vehicle.sensors.length; ++i) {
      bulbStrength = getBulbStrength(vehicle.x + simulationInfo.vehicleSize + simulationInfo.vehicleSize*Math.cos(vehicle.vehicle.angle + vehicle.vehicle.sensors[i].position), vehicle.y + simulationInfo.vehicleSize + simulationInfo.vehicleSize*Math.sin(vehicle.vehicle.angle + vehicle.vehicle.sensors[i].position));
      switch(vehicle.vehicle.sensors[i].type) {
      case "left":
        speedL += vehicle.vehicle.sensors[i].strength * bulbStrength * simulationInfo.bulbPower;
        break;
      case "right":
        speedR += vehicle.vehicle.sensors[i].strength * bulbStrength * simulationInfo.bulbPower;
        break;
      case "bulb":
        vehicle.bulb += vehicle.vehicle.sensors[i].strength * bulbStrength;
        break;
      }
    }
    vehicle.bulb = Math.max(0, Math.min(1, vehicle.bulb));
    speedL = simulationInfo.speedMultiplier*Math.max(-simulationInfo.moveSpeed, Math.min(simulationInfo.moveSpeed, speedL));
    speedR = simulationInfo.speedMultiplier*Math.max(-simulationInfo.moveSpeed, Math.min(simulationInfo.moveSpeed, speedR));
    if (speedL == speedR) {
      newX = vehicle.x + squashSpeed(speedL) * Math.cos(vehicle.vehicle.angle);
      newY = vehicle.y + squashSpeed(speedL) * Math.sin(vehicle.vehicle.angle);
    } else { 
      // Vehicle moves along virtual circle caused by left wheel advancing speedL
      // and right wheel advancing speedR, while distance between them remains vehicleSize
      radius = simulationInfo.vehicleSize * (speedL + speedR) / (speedL - speedR);
      if (speedL != 0) {
        dAngle = speedL / (2 * Math.PI * (radius + simulationInfo.vehicleSize));
      } else {
        dAngle = speedR / (2 * Math.PI * (radius - simulationInfo.vehicleSize));
      }
      if (isNaN(dAngle)) {
        console.log(vehicle);
        console.log(speedL+" "+speedR+" "+" "+radius);
        simulationInfo.doContinue = false;
        return;
      }
      // Vehicle moves dAngle degrees along the virtual circle
      newX = vehicle.x + radius * (Math.cos(vehicle.vehicle.angle - Math.PI/2 + dAngle) - Math.cos(vehicle.vehicle.angle - Math.PI/2));
      newY = vehicle.y + radius * (Math.sin(vehicle.vehicle.angle - Math.PI/2 + dAngle) - Math.sin(vehicle.vehicle.angle - Math.PI/2));
      vehicle.vehicle.angle = (vehicle.vehicle.angle + dAngle + 2*Math.PI)%(2*Math.PI);
    }
    newX = Math.max(1, Math.min(newX, simulationInfo.width - simulationInfo.vehicleSize*2));
    newY = Math.max(1, Math.min(newY, simulationInfo.height - simulationInfo.vehicleSize*2));
    stopMove = false;
    for (i = 0; i < vehicles.length; ++i) {
      if (vehicles[i] != vehicle) {
        if (Math.pow(vehicles[i].vehicle.x - newX, 2) + Math.pow(vehicles[i].vehicle.y - newY, 2) < simulationInfo.vehicleSize*simulationInfo.vehicleSize*4) {
          stopMove = true;
        }
      }
    }
    if (!stopMove) {
      vehicle.x = newX;
      vehicle.y = newY;
    }
    vehicle.vehicle.x = vehicle.x;
    vehicle.vehicle.y = vehicle.y;
  }
}

function plotSensor(ctx, x = this.x, y = this.y) {
  ctx.beginPath();
  //  ctx.arc(x + 45*Math.cos(this.sensor.position), y + 45*Math.sin(this.sensor.position), 3, 0, 2*Math.PI);
  ctx.arc(x + this.getWidth()/2, y + this.getHeight()/2, this.getWidth()/2, 0, 2*Math.PI);
  ctx.closePath();
  ctx.fillStyle = simulationInfo.sensorColors[this.sensor.type];
  ctx.fill();
  ctx.stroke();
}

function plotVehicle(ctx, xTopLeft = this.x, yTopLeft = this.y) {
  var x, y, scale, angle, i;
  if (ctx.canvas.id == "bayBraitenberg") {
    scale = 3;
    angle = -Math.PI/2;
  } else {
    scale = 1;
    angle = this.vehicle.angle;
  }
  x = xTopLeft + scale * simulationInfo.vehicleSize;
  y = yTopLeft + scale * simulationInfo.vehicleSize;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Wheels
  ctx.strokeStyle = "black";
  if (ctx.canvas.id == "bayBraitenberg") {
    ctx.fillStyle = "white";
    ctx.fillRect(-8*scale, -(simulationInfo.vehicleSize+1)*scale, 16*scale, (simulationInfo.vehicleSize+1)*scale);
    ctx.fillStyle = "black";
    ctx.fillRect(-8*scale, 0, 16*scale, (simulationInfo.vehicleSize+1)*scale);
  } else {
    ctx.fillStyle = "grey";
    ctx.fillRect(-8*scale,-(simulationInfo.vehicleSize+1)*scale,16*scale,2*(simulationInfo.vehicleSize+1)*scale);
  }
  ctx.strokeRect(-8*scale,-(simulationInfo.vehicleSize+1)*scale,16*scale,2*(simulationInfo.vehicleSize+1)*scale);

  // Base
  ctx.beginPath();
  ctx.arc(0, 0, scale*simulationInfo.vehicleSize, 0, 2*Math.PI);
  ctx.closePath();
  ctx.fillStyle = "lightgrey";
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(0, 0, scale*simulationInfo.vehicleSize*.4, -Math.PI/4, Math.PI/4);
  ctx.lineTo(scale*simulationInfo.vehicleSize*Math.cos(Math.PI/4)*.8, scale*simulationInfo.vehicleSize*Math.sin(Math.PI/4)*.8);
  ctx.arc(0, 0, scale*simulationInfo.vehicleSize*.8, Math.PI/4, -Math.PI/4,true);
  ctx.closePath();
  ctx.fillStyle = this.vehicle.color;
  ctx.fill();
  ctx.stroke();

  // Light
  ctx.beginPath();
  ctx.arc(0, 0, scale*this.lightSize, 0, 2*Math.PI);
  ctx.closePath();
  ctx.fillStyle = "rgb("+Math.floor(this.bulb * 256)+","+Math.floor(this.bulb * 256)+","+Math.floor(this.bulb * 256)+")";
  ctx.fill();
  ctx.stroke();

  // Sensors
  if (ctx.canvas.id != "bayBraitenberg") {
    for (i = 0; i < this.vehicle.sensors.length; ++i) {
      ctx.beginPath();
      ctx.arc(scale*simulationInfo.vehicleSize*Math.cos(this.vehicle.sensors[i].position), scale*simulationInfo.vehicleSize*Math.sin(this.vehicle.sensors[i].position), scale, 0, 2*Math.PI);
      ctx.closePath();
      ctx.fillStyle = simulationInfo.sensorColors[this.vehicle.sensors[i].type];
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function step() {
  var i;
  for (i = 0; i < vehicles.length; ++i) {
    moveVehicle(vehicles[i]);
  }
  requestRepaint();
  if (simulationInfo.doContinue) {
    setTimeout("step();", 25);
  }
}

function requestRepaint() {
  if (simulationInfo.handle == 0) {
    simulationInfo.handle = window.requestAnimationFrame(repaint);
  }
}

function getLightIntensity(squaredDist) {
  if (squaredDist == 0) {
    return 1;
  }
  return Math.pow(squaredDist, -0.5);
}

function getBlocking(bulbBlocked, distanceToTarget, target, bulb, vehicle) {
  var distanceToObject;
  distanceToObject = Math.pow(vehicle.x + simulationInfo.vehicleSize - bulb.x - simulationInfo.bulbSize, 2) + Math.pow(vehicle.y + simulationInfo.vehicleSize - bulb.y - simulationInfo.bulbSize, 2);
  if (distanceToObject < simulationInfo.vehicleSize*simulationInfo.vehicleSize + simulationInfo.bulbSize*simulationInfo.bulbSize) {
    bulbBlocked = 1;
  } else if (distanceToTarget > distanceToObject && distanceToTarget < distanceToObject + simulationInfo.shadowDistance) {
    if (Math.abs(bulb.x - vehicle.x) < simulationInfo.vehicleSize || Math.abs(bulb.y - vehicle.y) < simulationInfo.vehicleSize || (target.x - vehicle.x - simulationInfo.vehicleSize)*(bulb.x + simulationInfo.bulbSize - vehicle.x - simulationInfo.vehicleSize) <= 0 || (target.y - vehicle.y - simulationInfo.vehicleSize)*(bulb.y + simulationInfo.bulbSize - vehicle.y - simulationInfo.vehicleSize) <= 0) {
      angle = (target.x - bulb.x - simulationInfo.bulbSize)*(vehicle.x + simulationInfo.vehicleSize - bulb.x - simulationInfo.bulbSize) + (target.y - bulb.y - simulationInfo.bulbSize)*(vehicle.y + simulationInfo.vehicleSize - bulb.y - simulationInfo.bulbSize);
      if (angle > 0) {
        angle = Math.pow(angle,2);
        angle /= (Math.pow(vehicle.x + simulationInfo.vehicleSize - bulb.x - simulationInfo.bulbSize, 2) + Math.pow(vehicle.y + simulationInfo.vehicleSize - bulb.y - simulationInfo.bulbSize, 2))*(Math.pow(target.x - bulb.x - simulationInfo.bulbSize, 2) + Math.pow(target.y - bulb.y - simulationInfo.bulbSize, 2));
        // Angle is the the squared cosine of the angle between the vectors from the bulb to the vehicle and the bulb to the location
        if (angle + Math.pow(simulationInfo.vehicleSize,2) / distanceToObject > 1) {
          bulbBlocked = 1 - Math.min(1, Math.max(0, (1 - bulbBlocked)*(distanceToTarget - distanceToObject)/simulationInfo.shadowDistance));
        }
      }
    }
  }
  return bulbBlocked;
}

function getPositionalLighting(x, y) {
  var retVal, b, v, distanceToTarget, distanceToObject, bulbBlocked, angle, lightValue, curBlock;
  retVal = 0;
  for (b = 0; b < bulbs.length; ++b) {
    bulbBlocked = 0;
    distanceToTarget = Math.pow(bulbs[b].x + simulationInfo.bulbSize - x, 2) + Math.pow(bulbs[b].y + simulationInfo.bulbSize - y, 2);
    for (v = 0; bulbBlocked < 0.99 && v < vehicles.length; ++v) {
      bulbBlocked = getBlocking(bulbBlocked, distanceToTarget, {x: x, y: y}, bulbs[b], vehicles[v]);
    }
    lightValue = (1 - bulbBlocked) * getLightIntensity(distanceToTarget);
    if (lightValue > 0.1) {
      // Close enough for full brightness
      return 1;
    }  else {
      retVal += (1 - retVal)*10*lightValue;
    }
  }
  if (retVal < 0.99) {
    for (b = 0; b < vehicles.length; ++b) {
      bulbBlocked = 1 - vehicles[b].bulb;
      distanceToTarget = Math.pow(vehicles[b].x + simulationInfo.vehicleSize - x, 2) + Math.pow(vehicles[b].y + simulationInfo.vehicleSize - y, 2);
      if (distanceToTarget < 40 + Math.pow(simulationInfo.vehicleSize,2)) {
        continue;
      } else if (distanceToTarget < 100 + Math.pow(simulationInfo.vehicleSize,2)) {
        bulbBlocked = (1 - vehicles[b].bulb*(distanceToTarget - Math.pow(simulationInfo.vehicleSize,2) - 40) / 60);
      }
      for (v = 0; bulbBlocked < 0.99 && v < vehicles.length; ++v) {
        if (b == v) {
          continue;
        }
        bulbBlocked = getBlocking(bulbBlocked, distanceToTarget, {x: x, y: y}, {x: vehicles[b].x + simulationInfo.vehicleSize - simulationInfo.bulbSize, y: vehicles[b].y + simulationInfo.vehicleSize - simulationInfo.bulbSize}/*vehicles[b]*/, vehicles[v]);
      }
      lightValue = (1 - bulbBlocked) * getLightIntensity(distanceToTarget);
      if (isNaN(lightValue)) {
        console.log(bulbBlocked+"\t"+distanceToTarget);
      }
      if (lightValue > 0.1) {
        // Close enough for full brightness
        return 1;
      }  else {
        retVal += (1 - retVal)*10*lightValue;
      }
    }
  }
  return retVal;
}

function getBoardLighting() {
  var x, y, b, v, distanceToTarget, distanceToObject, bulbBlocked, angle, lightValue, curBlock;
  for (x = 0; x < simulationInfo.width; ++x) {
    for (y = 0; y < simulationInfo.height; ++y) {
      simulationInfo.lightIntensity[x][y] = getPositionalLighting(x, y);
    }
  }
}

function drawBoard(ctx) {
  var x, y, lightVal, curLightVal, angle, board;
  ctx.fillStyle = "#444444";
  ctx.fillRect(0, 0, simulationInfo.width, simulationInfo.height);
  ctx.strokeRect(1, 1, simulationInfo.width - 2, simulationInfo.height - 2);
  board = ctx.getImageData(0, 0, simulationInfo.width, simulationInfo.height);
  getBoardLighting();
  for (x = 0; x < simulationInfo.width; ++x) {
    for (y = 0; y < simulationInfo.height; ++y) {
      lightVal = 255 - board.data[(y * simulationInfo.width + x)*4];
      lightVal = Math.floor(lightVal*simulationInfo.lightIntensity[x][y]);
      board.data[(y * simulationInfo.width + x)*4] += lightVal;
      board.data[(y * simulationInfo.width + x)*4+1] += lightVal;
      board.data[(y * simulationInfo.width + x)*4+2] += lightVal;
    }
  }
  ctx.putImageData(board, 0, 0);
  for (i = 0; i < vehicles.length; ++i) {
    vehicles[i].draw(ctx);
  }
  for (i = 0; i < bulbs.length; ++i) {
    bulbs[i].draw(ctx);
  }
}

function repaint() {
  simulationInfo.handle = 0;
  repaintBay();
  drawBoard(document.getElementById("arenaBraitenberg").getContext("2d"));
}

function repaintBay(agent) {
  var i, ctx;
  ctx = document.getElementById("bayBraitenberg").getContext("2d");
  ctx.clearRect(0,0,150,150);
  simulationInfo.bayVehicle.draw(ctx, 10, 10);
  for (i = 0; i < sensors.length; ++i) {
    sensors[i].draw(ctx);
  }
}

function setBulbNumber(newValue) {
  while (bulbs.length > newValue) {
    bulbs[bulbs.length - 1] = null;
    bulbs.length = bulbs.length - 1;
  }
  while (bulbs.length < newValue) {
    bulbs[bulbs.length] = makeInteractiveElement(new BulbGraphics(braitenbergInfo.bulbs[bulbs.length]), document.getElementById("arenaBraitenberg"));
    bulbs[bulbs.length-1].x = braitenbergInfo.bulbs[bulbs.length].x;
    bulbs[bulbs.length-1].y = braitenbergInfo.bulbs[bulbs.length].y;
    bulbs[bulbs.length-1].onDragging = 
      function(agent, event) {
        requestRepaint();
      };
  }
  document.getElementById("bulbLabel").innerHTML = newValue;
}

function setVehicleNumber(newValue) {
  var n;
  while (vehicles.length > newValue) {
    vehicles[vehicles.length - 1] = null;
    vehicles.length = vehicles.length - 1;
  }
  while (vehicles.length < newValue) {
    n = vehicles.length;
    vehicles[n] = makeInteractiveElement(new VehicleGraphics(braitenbergInfo.vehicles[n]), document.getElementById("arenaBraitenberg"));
    vehicles[n].x = braitenbergInfo.vehicles[n].x;
    vehicles[n].y = braitenbergInfo.vehicles[n].y;
    vehicles[n].onDrop = function(agent, event) {
      agent.vehicle.x = agent.x;
      agent.vehicle.y = agent.y;
    };
    vehicles[n].onDrag =
      function(agent, event) {
      	agent.isDragged = true;
        loadBay(agent);
        return true;
      };
    vehicles[n].onDragging =
      function(agent, event) {
        requestRepaint();
      };
    vehicles[n].onDrop =
      function(agent, event) {
      	agent.isDragged = false;
      };
  }
  document.getElementById("vehicleLabel").innerHTML = newValue;
}

function setLightBulbValue(newValue) {
  simulationInfo.bayVehicle.vehicle.baseValues.bulb = newValue/100;
  document.getElementById("lightBulbLabel").innerHTML = simulationInfo.bayVehicle.vehicle.baseValues.bulb;
  document.getElementById("lightBulbDial").value = simulationInfo.bayVehicle.vehicle.baseValues.bulb*100;
}

function setLeftMotorValue(newValue) {
  simulationInfo.bayVehicle.vehicle.baseValues.left = newValue/10;
  document.getElementById("leftMotorLabel").innerHTML = simulationInfo.bayVehicle.vehicle.baseValues.left;
  document.getElementById("leftMotorDial").value = simulationInfo.bayVehicle.vehicle.baseValues.left*10;
}

function setRightMotorValue(newValue) {
  simulationInfo.bayVehicle.vehicle.baseValues.right = newValue/10;
  document.getElementById("rightMotorLabel").innerHTML = simulationInfo.bayVehicle.vehicle.baseValues.right;
  document.getElementById("rightMotorDial").value = simulationInfo.bayVehicle.vehicle.baseValues.right*10;
}

function setSensorStrength(newValue) {
  simulationInfo.baySensor.strength = newValue / 10;
  document.getElementById("sensorStrengthLabel").innerHTML = simulationInfo.baySensor.strength;
  document.getElementById("sensorStrengthDial").value = simulationInfo.baySensor.strength*10;
}

function changeMotor(value) {
  simulationInfo.baySensor.type = ["left","right","bulb"][value];
  loadSensorInfo(simulationInfo.baySensor);
  repaintBay();
}

function setSensorNumber(newValue) {
  while (newValue*1 < simulationInfo.bayVehicle.vehicle.sensors.length) {
    simulationInfo.bayVehicle.vehicle.sensors[simulationInfo.bayVehicle.vehicle.sensors.length - 1] = null;
    simulationInfo.bayVehicle.vehicle.sensors.length = simulationInfo.bayVehicle.vehicle.sensors.length - 1;
  }
  while (newValue*1 > simulationInfo.bayVehicle.vehicle.sensors.length) {
    simulationInfo.bayVehicle.vehicle.sensors[simulationInfo.bayVehicle.vehicle.sensors.length] = {position: Math.random()*Math.PI*2, type: "left", strength: 0};
  }
  loadBay(simulationInfo.bayVehicle);
}

function toggleSimulation() {
  simulationInfo.doContinue = !simulationInfo.doContinue;
  document.getElementById("startButton").value = (simulationInfo.doContinue ? "Pause simulation" : "Continue simulation");
  if (simulationInfo.doContinue) {
    step();
  }
}

function loadInfo() {
  var newInfo, i;
  newInfo = JSON.parse(window.prompt("Please enter the new Braitenberg vehicle and lightbulb information.",JSON.stringify(braitenbergInfo)));
  if (newInfo != null) {
    braitenbergInfo = newInfo;
    for (i = 0; i < bulbs.length; ++i) {
      bulbs[i].bulb = braitenbergInfo.bulbs[i];
      bulbs[i].x = bulbs[i].bulb.x;
      bulbs[i].y = bulbs[i].bulb.y;
    }
    for (i = 0; i < vehicles.length; ++i) {
      vehicles[i].vehicle = braitenbergInfo.vehicles[i];
      vehicles[i].x = vehicles[i].vehicle.x;
      vehicles[i].y = vehicles[i].vehicle.y;
    }
  }
  loadBay(vehicles[0]);
  requestRepaint();
}

function loadVehicle() {
  var i, newInfo;
  switch(document.getElementById("vehicleSelectBox").selectedIndex) {
  case 0: //Aggression
    simulationInfo.bayVehicle.vehicle.baseValues = {left: 1, right: 1, bulb: 0};
    simulationInfo.bayVehicle.vehicle.sensors = [{position: -Math.PI/4, type: "right", strength: 1}, {position: Math.PI/4, type: "left", strength: 1}];
    break;

  case 1: //Fear
    simulationInfo.bayVehicle.vehicle.baseValues = {left: 1, right: 1, bulb: 0};
    simulationInfo.bayVehicle.vehicle.sensors = [{position: -Math.PI/4, type: "left", strength: 1}, {position: Math.PI/4, type: "right", strength: 1}];
    break;

  case 2: //Love
    simulationInfo.bayVehicle.vehicle.baseValues = {left: 5, right: 5, bulb: 0};
    simulationInfo.bayVehicle.vehicle.sensors = [{position: -Math.PI/4, type: "left", strength: -0.5}, {position: Math.PI/4, type: "right", strength: -0.5}];
    break;

  case 3: //Exploration
    simulationInfo.bayVehicle.vehicle.baseValues = {left: 5, right: 5, bulb: 0};
    simulationInfo.bayVehicle.vehicle.sensors = [{position: -Math.PI/4, type: "right", strength: -0.5}, {position: Math.PI/4, type: "left", strength: -0.5}];
    break;
    
  default:
    for (i = 0; i < braitenbergInfo.vehicles.length; ++i) {
      if (simulationInfo.bayVehicle.vehicle == braitenbergInfo.vehicles[i]) {
        newInfo = JSON.parse(window.prompt("Please enter the new vehicle information.",JSON.stringify(braitenbergInfo.vehicles[i])));
        if (newInfo != null) {
          simulationInfo.bayVehicle.vehicle = newInfo;
          braitenbergInfo.vehicles[i] = newInfo;
        }
        break;
      }
    }
  }
  loadBay(simulationInfo.bayVehicle);
}

function saveSetup() {
  var element = document.createElement('a');
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(braitenbergInfo)));
  element.setAttribute("download", "braitenberg.txt");
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function getSensorResponse(lightIntensity) {
  //    return lightIntensity * (1 - lightIntensity) * simulationInfo.bulbPower;
  return lightIntensity * simulationInfo.bulbPower;
}

