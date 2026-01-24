// HanX Sensors Extension - Arduino Code Generator
// This file is executed in a context with 'generator' and 'Blockly' available

generator.forBlock['sensor_dht_setup'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var type = block.getFieldValue('TYPE');
  
  generator.addDefinition('include_dht', '#include <DHT.h>');
  generator.addDefinition('define_dht_pin', '#define DHT_PIN ' + pin);
  generator.addDefinition('define_dht_type', '#define DHT_TYPE ' + type);
  generator.addDefinition('dht_instance', 'DHT dht(DHT_PIN, DHT_TYPE);');
  
  generator.addSetup('dht_begin', 'dht.begin();');
  
  return '';
};

generator.forBlock['sensor_dht_read_temp'] = function(block) {
  generator.addDefinition('include_dht', '#include <DHT.h>');
  return ['dht.readTemperature()', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['sensor_dht_read_humidity'] = function(block) {
  generator.addDefinition('include_dht', '#include <DHT.h>');
  return ['dht.readHumidity()', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['sensor_ultrasonic_setup'] = function(block) {
  var trigPin = block.getFieldValue('TRIG');
  var echoPin = block.getFieldValue('ECHO');
  
  generator.addDefinition('ultrasonic_trig', '#define ULTRASONIC_TRIG ' + trigPin);
  generator.addDefinition('ultrasonic_echo', '#define ULTRASONIC_ECHO ' + echoPin);
  
  generator.addSetup('ultrasonic_pins', 
    'pinMode(ULTRASONIC_TRIG, OUTPUT);\n  pinMode(ULTRASONIC_ECHO, INPUT);');
  
  // Define helper function
  generator.addDefinition('func_getDistance', 
`float getUltrasonicDistance() {
  digitalWrite(ULTRASONIC_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(ULTRASONIC_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIG, LOW);
  long duration = pulseIn(ULTRASONIC_ECHO, HIGH);
  return duration * 0.034 / 2;
}`);
  
  return '';
};

generator.forBlock['sensor_ultrasonic_distance'] = function(block) {
  return ['getUltrasonicDistance()', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['sensor_light_read'] = function(block) {
  var pin = block.getFieldValue('PIN');
  return ['analogRead(A' + pin + ')', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['sensor_ir_obstacle'] = function(block) {
  var pin = block.getFieldValue('PIN');
  generator.addSetup('ir_pin_' + pin, 'pinMode(' + pin + ', INPUT);');
  return ['(digitalRead(' + pin + ') == LOW)', generator.PRECEDENCE.ORDER_EQUALITY];
};

generator.forBlock['sensor_soil_moisture'] = function(block) {
  var pin = block.getFieldValue('PIN');
  return ['analogRead(A' + pin + ')', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['sensor_button_pressed'] = function(block) {
  var pin = block.getFieldValue('PIN');
  generator.addSetup('button_pin_' + pin, 'pinMode(' + pin + ', INPUT_PULLUP);');
  return ['(digitalRead(' + pin + ') == LOW)', generator.PRECEDENCE.ORDER_EQUALITY];
};

generator.forBlock['sensor_touch_detected'] = function(block) {
  var pin = block.getFieldValue('PIN');
  generator.addSetup('touch_pin_' + pin, 'pinMode(' + pin + ', INPUT);');
  return ['(digitalRead(' + pin + ') == HIGH)', generator.PRECEDENCE.ORDER_EQUALITY];
};
