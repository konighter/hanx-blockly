// HanX Motor Driver Extension - Arduino Code Generator
// This file is executed in a context with 'generator' and 'Blockly' available

// ============ Servo Motor ============

generator.forBlock['motor_servo_attach'] = function(block) {
  var name = block.getFieldValue('NAME');
  var pin = block.getFieldValue('PIN');
  
  generator.addDefinition('include_servo', '#include <Servo.h>');
  generator.addDefinition('servo_' + name, 'Servo ' + name + ';');
  generator.addSetup('servo_attach_' + name, name + '.attach(' + pin + ');');
  
  return '';
};

generator.forBlock['motor_servo_write'] = function(block) {
  var name = block.getFieldValue('NAME');
  var angle = generator.valueToCode(block, 'ANGLE', generator.PRECEDENCE.ATOMIC) || '90';
  return name + '.write(' + angle + ');\n';
};

generator.forBlock['motor_servo_read'] = function(block) {
  var name = block.getFieldValue('NAME');
  return [name + '.read()', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['motor_servo_detach'] = function(block) {
  var name = block.getFieldValue('NAME');
  return name + '.detach();\n';
};

// ============ DC Motor (L298N/L293D) ============

generator.forBlock['motor_dc_setup'] = function(block) {
  var name = block.getFieldValue('NAME');
  var in1 = block.getFieldValue('IN1');
  var in2 = block.getFieldValue('IN2');
  var ena = block.getFieldValue('ENA');
  
  generator.addDefinition('motor_' + name + '_in1', '#define ' + name.toUpperCase() + '_IN1 ' + in1);
  generator.addDefinition('motor_' + name + '_in2', '#define ' + name.toUpperCase() + '_IN2 ' + in2);
  generator.addDefinition('motor_' + name + '_ena', '#define ' + name.toUpperCase() + '_ENA ' + ena);
  
  generator.addSetup('motor_' + name + '_pins', 
    'pinMode(' + name.toUpperCase() + '_IN1, OUTPUT);\n' +
    '  pinMode(' + name.toUpperCase() + '_IN2, OUTPUT);\n' +
    '  pinMode(' + name.toUpperCase() + '_ENA, OUTPUT);');
  
  return '';
};

generator.forBlock['motor_dc_forward'] = function(block) {
  var name = block.getFieldValue('NAME');
  return 'digitalWrite(' + name.toUpperCase() + '_IN1, HIGH);\n' +
         'digitalWrite(' + name.toUpperCase() + '_IN2, LOW);\n';
};

generator.forBlock['motor_dc_backward'] = function(block) {
  var name = block.getFieldValue('NAME');
  return 'digitalWrite(' + name.toUpperCase() + '_IN1, LOW);\n' +
         'digitalWrite(' + name.toUpperCase() + '_IN2, HIGH);\n';
};

generator.forBlock['motor_dc_stop'] = function(block) {
  var name = block.getFieldValue('NAME');
  return 'digitalWrite(' + name.toUpperCase() + '_IN1, LOW);\n' +
         'digitalWrite(' + name.toUpperCase() + '_IN2, LOW);\n';
};

generator.forBlock['motor_dc_speed'] = function(block) {
  var name = block.getFieldValue('NAME');
  var speed = generator.valueToCode(block, 'SPEED', generator.PRECEDENCE.ATOMIC) || '255';
  return 'analogWrite(' + name.toUpperCase() + '_ENA, ' + speed + ');\n';
};

// ============ Stepper Motor ============

generator.forBlock['motor_stepper_setup'] = function(block) {
  var steps = block.getFieldValue('STEPS');
  var pin1 = block.getFieldValue('PIN1');
  var pin2 = block.getFieldValue('PIN2');
  var pin3 = block.getFieldValue('PIN3');
  var pin4 = block.getFieldValue('PIN4');
  
  generator.addDefinition('include_stepper', '#include <Stepper.h>');
  generator.addDefinition('stepper_instance', 
    'Stepper myStepper(' + steps + ', ' + pin1 + ', ' + pin2 + ', ' + pin3 + ', ' + pin4 + ');');
  
  return '';
};

generator.forBlock['motor_stepper_step'] = function(block) {
  generator.addDefinition('include_stepper', '#include <Stepper.h>');
  var steps = generator.valueToCode(block, 'STEPS', generator.PRECEDENCE.ATOMIC) || '100';
  var dir = block.getFieldValue('DIR');
  if (dir === '-1') {
    return 'myStepper.step(-' + steps + ');\n';
  }
  return 'myStepper.step(' + steps + ');\n';
};

generator.forBlock['motor_stepper_speed'] = function(block) {
  generator.addDefinition('include_stepper', '#include <Stepper.h>');
  var rpm = generator.valueToCode(block, 'RPM', generator.PRECEDENCE.ATOMIC) || '60';
  return 'myStepper.setSpeed(' + rpm + ');\n';
};

// ============ TB6612FNG Motor Driver ============

generator.forBlock['motor_tb6612_setup'] = function(block) {
  var stby = block.getFieldValue('STBY');
  var pwma = block.getFieldValue('PWMA');
  var ain1 = block.getFieldValue('AIN1');
  var ain2 = block.getFieldValue('AIN2');
  var pwmb = block.getFieldValue('PWMB');
  var bin1 = block.getFieldValue('BIN1');
  var bin2 = block.getFieldValue('BIN2');
  
  generator.addDefinition('tb6612_pins', 
    '#define TB6612_STBY ' + stby + '\n' +
    '#define TB6612_PWMA ' + pwma + '\n' +
    '#define TB6612_AIN1 ' + ain1 + '\n' +
    '#define TB6612_AIN2 ' + ain2 + '\n' +
    '#define TB6612_PWMB ' + pwmb + '\n' +
    '#define TB6612_BIN1 ' + bin1 + '\n' +
    '#define TB6612_BIN2 ' + bin2);
  
  generator.addSetup('tb6612_setup', 
    'pinMode(TB6612_STBY, OUTPUT);\n' +
    '  pinMode(TB6612_PWMA, OUTPUT);\n' +
    '  pinMode(TB6612_AIN1, OUTPUT);\n' +
    '  pinMode(TB6612_AIN2, OUTPUT);\n' +
    '  pinMode(TB6612_PWMB, OUTPUT);\n' +
    '  pinMode(TB6612_BIN1, OUTPUT);\n' +
    '  pinMode(TB6612_BIN2, OUTPUT);\n' +
    '  digitalWrite(TB6612_STBY, HIGH);');
  
  return '';
};

generator.forBlock['motor_tb6612_motor'] = function(block) {
  var motor = block.getFieldValue('MOTOR');
  var dir = block.getFieldValue('DIR');
  var speed = generator.valueToCode(block, 'SPEED', generator.PRECEDENCE.ATOMIC) || '0';
  
  var in1 = motor === 'A' ? 'TB6612_AIN1' : 'TB6612_BIN1';
  var in2 = motor === 'A' ? 'TB6612_AIN2' : 'TB6612_BIN2';
  var pwm = motor === 'A' ? 'TB6612_PWMA' : 'TB6612_PWMB';
  
  var code = '';
  if (dir === 'FORWARD') {
    code += 'digitalWrite(' + in1 + ', HIGH);\n';
    code += 'digitalWrite(' + in2 + ', LOW);\n';
  } else if (dir === 'BACKWARD') {
    code += 'digitalWrite(' + in1 + ', LOW);\n';
    code += 'digitalWrite(' + in2 + ', HIGH);\n';
  } else {
    code += 'digitalWrite(' + in1 + ', LOW);\n';
    code += 'digitalWrite(' + in2 + ', LOW);\n';
  }
  code += 'analogWrite(' + pwm + ', ' + speed + ');\n';
  
  return code;
};
