// HanX Turtle Graphics Extension - Python Code Generator
// This file is executed in a context with 'generator' and 'Blockly' available

generator.forBlock['turtle_create'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  return 'turtle.setup(800, 600)\n';
};

generator.forBlock['turtle_forward'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  var distance = generator.valueToCode(block, 'DISTANCE', 3) || '100';
  return 'turtle.forward(' + distance + ')\n';
};

generator.forBlock['turtle_backward'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  var distance = generator.valueToCode(block, 'DISTANCE', 3) || '100';
  return 'turtle.backward(' + distance + ')\n';
};

generator.forBlock['turtle_left'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  var angle = generator.valueToCode(block, 'ANGLE', 3) || '90';
  return 'turtle.left(' + angle + ')\n';
};

generator.forBlock['turtle_right'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  var angle = generator.valueToCode(block, 'ANGLE', 3) || '90';
  return 'turtle.right(' + angle + ')\n';
};

generator.forBlock['turtle_penup'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  return 'turtle.penup()\n';
};

generator.forBlock['turtle_pendown'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  return 'turtle.pendown()\n';
};

generator.forBlock['turtle_goto'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  var x = generator.valueToCode(block, 'X', 3) || '0';
  var y = generator.valueToCode(block, 'Y', 3) || '0';
  return 'turtle.goto(' + x + ', ' + y + ')\n';
};

generator.forBlock['turtle_circle'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  var radius = generator.valueToCode(block, 'RADIUS', 3) || '50';
  return 'turtle.circle(' + radius + ')\n';
};

generator.forBlock['turtle_color'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  var color = block.getFieldValue('COLOR');
  return 'turtle.color("' + color + '")\n';
};

generator.forBlock['turtle_pensize'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  var size = generator.valueToCode(block, 'SIZE', 3) || '1';
  return 'turtle.pensize(' + size + ')\n';
};

generator.forBlock['turtle_speed'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  var speed = block.getFieldValue('SPEED');
  return 'turtle.speed(' + speed + ')\n';
};

generator.forBlock['turtle_fillcolor'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  var color = block.getFieldValue('COLOR');
  return 'turtle.fillcolor("' + color + '")\n';
};

generator.forBlock['turtle_begin_fill'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  return 'turtle.begin_fill()\n';
};

generator.forBlock['turtle_end_fill'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  return 'turtle.end_fill()\n';
};

generator.forBlock['turtle_hide'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  return 'turtle.hideturtle()\n';
};

generator.forBlock['turtle_show'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  return 'turtle.showturtle()\n';
};

generator.forBlock['turtle_done'] = function(block) {
  generator.definitions_['import_turtle'] = 'import turtle';
  return 'turtle.done()\n';
};
