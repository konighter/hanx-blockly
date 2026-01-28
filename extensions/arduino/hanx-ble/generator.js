// HanX BLE Extension - Arduino Code Generator

generator.forBlock['ble_init'] = function(block) {
  var name = generator.valueToCode(block, 'NAME', generator.PRECEDENCE.ATOMIC) || '"ArduinoR4"';
  
  generator.addDefinition('include_ble', '#include <ArduinoBLE.h>');
  generator.addSetup('ble_begin', 'if (!BLE.begin()) { while (1); }\n  BLE.setLocalName(' + name + ');\n  BLE.setDeviceName(' + name + ');');
  
  return '';
};

generator.forBlock['ble_advertise'] = function(block) {
  return 'BLE.advertise();\n';
};

generator.forBlock['ble_is_connected'] = function(block) {
  return ['BLE.central().connected()', generator.PRECEDENCE.ATOMIC];
};
