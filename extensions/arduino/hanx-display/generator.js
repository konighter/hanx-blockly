// HanX OLED Display Extension - Arduino Code Generator
// This file is executed in a context with 'generator' and 'Blockly' available

generator.forBlock['oled_init'] = function(block) {
  var width = block.getFieldValue('WIDTH');
  var height = block.getFieldValue('HEIGHT');
  var addr = block.getFieldValue('ADDR');
  
  generator.addDefinition('include_wire', '#include <Wire.h>');
  generator.addDefinition('include_gfx', '#include <Adafruit_GFX.h>');
  generator.addDefinition('include_ssd1306', '#include <Adafruit_SSD1306.h>');
  
  generator.addDefinition('oled_dimensions', 
    '#define OLED_WIDTH ' + width + '\n#define OLED_HEIGHT ' + height);
  generator.addDefinition('oled_instance', 
    'Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);');
  
  generator.addSetup('oled_init', 
    'if (!display.begin(SSD1306_SWITCHCAPVCC, ' + addr + ')) {\n' +
    '    Serial.println(F("SSD1306 初始化失败"));\n' +
    '    while(1);\n' +
    '  }\n' +
    '  display.clearDisplay();\n' +
    '  display.setTextColor(WHITE);');
  
  return '';
};

generator.forBlock['oled_clear'] = function(block) {
  return 'display.clearDisplay();\n';
};

generator.forBlock['oled_display'] = function(block) {
  return 'display.display();\n';
};

generator.forBlock['oled_set_cursor'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  return 'display.setCursor(' + x + ', ' + y + ');\n';
};

generator.forBlock['oled_set_textsize'] = function(block) {
  var size = block.getFieldValue('SIZE');
  return 'display.setTextSize(' + size + ');\n';
};

generator.forBlock['oled_set_textcolor'] = function(block) {
  var color = block.getFieldValue('COLOR');
  return 'display.setTextColor(' + color + ');\n';
};

generator.forBlock['oled_print'] = function(block) {
  var text = generator.valueToCode(block, 'TEXT', generator.PRECEDENCE.ATOMIC) || '""';
  return 'display.print(' + text + ');\n';
};

generator.forBlock['oled_println'] = function(block) {
  var text = generator.valueToCode(block, 'TEXT', generator.PRECEDENCE.ATOMIC) || '""';
  return 'display.println(' + text + ');\n';
};

generator.forBlock['oled_draw_pixel'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  var color = block.getFieldValue('COLOR');
  return 'display.drawPixel(' + x + ', ' + y + ', ' + color + ');\n';
};

generator.forBlock['oled_draw_line'] = function(block) {
  var x1 = generator.valueToCode(block, 'X1', generator.PRECEDENCE.ATOMIC) || '0';
  var y1 = generator.valueToCode(block, 'Y1', generator.PRECEDENCE.ATOMIC) || '0';
  var x2 = generator.valueToCode(block, 'X2', generator.PRECEDENCE.ATOMIC) || '10';
  var y2 = generator.valueToCode(block, 'Y2', generator.PRECEDENCE.ATOMIC) || '10';
  return 'display.drawLine(' + x1 + ', ' + y1 + ', ' + x2 + ', ' + y2 + ', WHITE);\n';
};

generator.forBlock['oled_draw_rect'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  var w = generator.valueToCode(block, 'W', generator.PRECEDENCE.ATOMIC) || '20';
  var h = generator.valueToCode(block, 'H', generator.PRECEDENCE.ATOMIC) || '10';
  return 'display.drawRect(' + x + ', ' + y + ', ' + w + ', ' + h + ', WHITE);\n';
};

generator.forBlock['oled_fill_rect'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  var w = generator.valueToCode(block, 'W', generator.PRECEDENCE.ATOMIC) || '20';
  var h = generator.valueToCode(block, 'H', generator.PRECEDENCE.ATOMIC) || '10';
  return 'display.fillRect(' + x + ', ' + y + ', ' + w + ', ' + h + ', WHITE);\n';
};

generator.forBlock['oled_draw_circle'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '64';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '32';
  var r = generator.valueToCode(block, 'R', generator.PRECEDENCE.ATOMIC) || '10';
  return 'display.drawCircle(' + x + ', ' + y + ', ' + r + ', WHITE);\n';
};

generator.forBlock['oled_fill_circle'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '64';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '32';
  var r = generator.valueToCode(block, 'R', generator.PRECEDENCE.ATOMIC) || '10';
  return 'display.fillCircle(' + x + ', ' + y + ', ' + r + ', WHITE);\n';
};
