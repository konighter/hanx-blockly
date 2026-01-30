// HanX BLE Extension - Arduino Code Generator

generator.forBlock['ble_init'] = function(block) {
  var name = generator.valueToCode(block, 'NAME', generator.PRECEDENCE.ATOMIC) || '"ArduinoR4"';
  
  generator.addDefinition('include_ble', '#include <ArduinoBLE.h>');
  generator.addLoop('ble_poll', 'BLE.poll();');
  
  generator.addSetup('ble_01_init', 'if (!BLE.begin()) { while (1); }\n  BLE.setLocalName(' + name + ');\n  BLE.setDeviceName(' + name + ');');
  
  return '';
};

generator.forBlock['ble_advertise'] = function(block) {
  return 'BLE.advertise();\n';
};

generator.forBlock['ble_is_connected'] = function(block) {
  return ['BLE.central().connected()', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['ble_service_init'] = function(block) {
  var uuid = block.getFieldValue('UUID');
  var varName = 'bleService_' + uuid.replace(/[^a-zA-Z0-9]/g, '_');
  
  generator.ble_last_service_var = varName;
  
  generator.addDefinition('include_ble', '#include <ArduinoBLE.h>');
  generator.addDefinition('var_ble_service_' + uuid, 'BLEService ' + varName + '("' + uuid + '");');
  
  // Services MUST be added AFTER characteristics are added to them.
  // Use index 20 to ensure it happens after index 10 (characteristics).
  generator.addSetup('ble_20_service_add_' + uuid, 'BLE.addService(' + varName + ');\n  BLE.setAdvertisedService(' + varName + ');');
  
  return '';
};

generator.forBlock['ble_char_init'] = function(block) {
  var uuid = block.getFieldValue('UUID');
  var prop = block.getFieldValue('PROP');
  var type = block.getFieldValue('TYPE');
  var varName = 'bleChar_' + uuid.replace(/[^a-zA-Z0-9]/g, '_');
  
  generator.addDefinition('include_ble', '#include <ArduinoBLE.h>');
  
  // 1. Determine service
  var serviceVar = generator.ble_last_service_var;
  if (!serviceVar) {
    serviceVar = 'bleService_default';
    generator.addDefinition('var_ble_service_default', 'BLEService ' + serviceVar + '("1800");'); // Generic Access
    // Default service also added at index 20
    generator.addSetup('ble_20_service_add_default', 'BLE.addService(' + serviceVar + ');');
    generator.ble_last_service_var = serviceVar;
  }

  // 2. Define Characteristic
  var charDef = type + ' ' + varName + '("' + uuid + '", ' + prop;
  if (type === 'BLEStringCharacteristic') {
    charDef += ', 512'; // Max length for string
  }
  charDef += ');';
  
  generator.addDefinition('var_ble_char_' + uuid, charDef);
  
  // 3. Add to Service at index 10 (BEFORE service is added to BLE at index 20)
  generator.addSetup('ble_10_char_add_' + uuid, serviceVar + '.addCharacteristic(' + varName + ');');
  
  return '';
};

generator.forBlock['ble_char_write'] = function(block) {
  var uuid = block.getFieldValue('UUID');
  var value = generator.valueToCode(block, 'VALUE', generator.PRECEDENCE.ATOMIC) || '0';
  var varName = 'bleChar_' + uuid.replace(/[^a-zA-Z0-9]/g, '_');
  
  return varName + '.writeValue(' + value + ');\n';
};

generator.forBlock['ble_char_read'] = function(block) {
  var uuid = block.getFieldValue('UUID');
  var varName = 'bleChar_' + uuid.replace(/[^a-zA-Z0-9]/g, '_');
  
  return [varName + '.value()', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['ble_char_was_written'] = function(block) {
  var uuid = block.getFieldValue('UUID');
  var varName = 'bleChar_' + uuid.replace(/[^a-zA-Z0-9]/g, '_');
  
  return [varName + '.written()', generator.PRECEDENCE.ATOMIC];
};
