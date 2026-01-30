// ArduinoJson Extension - Code Generator

generator.forBlock['json_parse'] = function(block) {
  var jsonStr = generator.valueToCode(block, 'JSON_STR', generator.PRECEDENCE.ATOMIC) || '""';
  
  generator.addDefinition('include_json', '#include <ArduinoJson.h>');
  generator.addDefinition('var_json_doc', 'StaticJsonDocument<512> doc;');
  
  return 'deserializeJson(doc, ' + jsonStr + ');\n';
};

generator.forBlock['json_get_value'] = function(block) {
  var key = block.getFieldValue('KEY');
  var type = block.getFieldValue('TYPE');
  
  var code = 'doc["' + key + '"].as<' + type + '>()';
  
  return [code, generator.PRECEDENCE.ATOMIC];
};
