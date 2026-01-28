// HanX Bluetooth Extension - Arduino Code Generator

generator.forBlock['bluetooth_init'] = function(block) {
  var rx = block.getFieldValue('RX');
  var tx = block.getFieldValue('TX');
  var baud = block.getFieldValue('BAUD');
  
  generator.addDefinition('include_software_serial', '#include <SoftwareSerial.h>');
  generator.addDefinition('bluetooth_serial', 'SoftwareSerial BTSerial(' + rx + ', ' + tx + ');');
  
  return 'BTSerial.begin(' + baud + ');\n';
};

generator.forBlock['bluetooth_available'] = function(block) {
  return ['BTSerial.available() > 0', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['bluetooth_read'] = function(block) {
  return ['BTSerial.read()', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['bluetooth_read_string'] = function(block) {
  return ['BTSerial.readString()', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['bluetooth_print'] = function(block) {
  var content = generator.valueToCode(block, 'CONTENT', generator.PRECEDENCE.ATOMIC) || '""';
  return 'BTSerial.print(' + content + ');\n';
};

generator.forBlock['bluetooth_println'] = function(block) {
  var content = generator.valueToCode(block, 'CONTENT', generator.PRECEDENCE.ATOMIC) || '""';
  return 'BTSerial.println(' + content + ');\n';
};
