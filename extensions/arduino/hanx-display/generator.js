// HanX Display Extension - Code Generator
// Supports OLED (U8g2) and TFT (GC9A01)

// --- OLED (U8g2) ---

generator.forBlock['oled_init'] = function(block) {
  var driver = block.getFieldValue('DRIVER');
  var width = block.getFieldValue('WIDTH');
  var height = block.getFieldValue('HEIGHT');
  var addr = block.getFieldValue('ADDR');
  
  generator.addDefinition('include_arduino', '#include <Arduino.h>');
  generator.addDefinition('include_u8g2', '#include <U8g2lib.h>');
  generator.addDefinition('include_wire', '#include <Wire.h>');
  
  var res = width + 'X' + height;
  var constructor = '';
  
  if (driver === 'SSD1306') {
    constructor = 'U8G2_SSD1306_' + res + '_VHR_F_HW_I2C u8g2(U8G2_R0, /* reset=*/ U8X8_PIN_NONE);';
  } else if (driver === 'SH1106') {
    constructor = 'U8G2_SH1106_' + res + '_WINSTAR_F_HW_I2C u8g2(U8G2_R0, /* reset=*/ U8X8_PIN_NONE);';
  }
  
  generator.addDefinition('oled_instance', constructor);
  
  generator.addSetup('oled_init', 
    'u8g2.begin();\n' +
    '  u8g2.setFont(u8g2_font_ncenB08_tr); // Set default font');
  
  return '';
};

generator.forBlock['oled_clear'] = function(block) {
  return 'u8g2.clearBuffer();\n';
};

generator.forBlock['oled_display'] = function(block) {
  return 'u8g2.sendBuffer();\n';
};

generator.forBlock['oled_set_cursor'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  return 'u8g2.setCursor(' + x + ', ' + y + ');\n';
};

generator.forBlock['oled_print'] = function(block) {
  var text = generator.valueToCode(block, 'TEXT', generator.PRECEDENCE.ATOMIC) || '""';
  return 'u8g2.print(' + text + ');\n';
};

generator.forBlock['oled_println'] = function(block) {
  var text = generator.valueToCode(block, 'TEXT', generator.PRECEDENCE.ATOMIC) || '""';
  return 'u8g2.println(' + text + ');\n';
};

generator.forBlock['oled_set_textsize'] = function(block) {
  var size = block.getFieldValue('SIZE');
  var font = 'u8g2_font_ncenB08_tr';
  if (size === '2') font = 'u8g2_font_ncenB14_tr';
  if (size === '3') font = 'u8g2_font_ncenB18_tr';
  if (size === '4') font = 'u8g2_font_ncenB24_tr';
  return 'u8g2.setFont(' + font + ');\n';
};

generator.forBlock['oled_set_textcolor'] = function(block) {
  var color = block.getFieldValue('COLOR');
  var val = (color === 'WHITE') ? '1' : '0';
  return 'u8g2.setDrawColor(' + val + ');\n';
};

generator.forBlock['oled_draw_pixel'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  return 'u8g2.drawPixel(' + x + ', ' + y + ');\n';
};

generator.forBlock['oled_draw_line'] = function(block) {
  var x1 = generator.valueToCode(block, 'X1', generator.PRECEDENCE.ATOMIC) || '0';
  var y1 = generator.valueToCode(block, 'Y1', generator.PRECEDENCE.ATOMIC) || '0';
  var x2 = generator.valueToCode(block, 'X2', generator.PRECEDENCE.ATOMIC) || '10';
  var y2 = generator.valueToCode(block, 'Y2', generator.PRECEDENCE.ATOMIC) || '10';
  return 'u8g2.drawLine(' + x1 + ', ' + y1 + ', ' + x2 + ', ' + y2 + ');\n';
};

generator.forBlock['oled_draw_rect'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  var w = generator.valueToCode(block, 'W', generator.PRECEDENCE.ATOMIC) || '20';
  var h = generator.valueToCode(block, 'H', generator.PRECEDENCE.ATOMIC) || '10';
  return 'u8g2.drawFrame(' + x + ', ' + y + ', ' + w + ', ' + h + ');\n';
};

generator.forBlock['oled_fill_rect'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  var w = generator.valueToCode(block, 'W', generator.PRECEDENCE.ATOMIC) || '20';
  var h = generator.valueToCode(block, 'H', generator.PRECEDENCE.ATOMIC) || '10';
  return 'u8g2.drawBox(' + x + ', ' + y + ', ' + w + ', ' + h + ');\n';
};

generator.forBlock['oled_draw_circle'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '64';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '32';
  var r = generator.valueToCode(block, 'R', generator.PRECEDENCE.ATOMIC) || '10';
  return 'u8g2.drawCircle(' + x + ', ' + y + ', ' + r + ');\n';
};

generator.forBlock['oled_fill_circle'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '64';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '32';
  var r = generator.valueToCode(block, 'R', generator.PRECEDENCE.ATOMIC) || '10';
  return 'u8g2.drawDisc(' + x + ', ' + y + ', ' + r + ');\n';
};

// --- TFT (GC9A01) ---

generator.forBlock['tft_init'] = function(block) {
  var cs = block.getFieldValue('CS');
  var dc = block.getFieldValue('DC');
  var rst = block.getFieldValue('RST');
  
  generator.addDefinition('include_spi', '#include <SPI.h>');
  generator.addDefinition('include_gfx', '#include <Adafruit_GFX.h>');
  generator.addDefinition('include_gc9a01', '#include <Adafruit_GC9A01A.h>');
  
  generator.addDefinition('tft_instance', 'Adafruit_GC9A01A tft(' + cs + ', ' + dc + ', ' + rst + ');');
  
  generator.addSetup('tft_init', 'tft.begin();');
  
  return '';
};

generator.forBlock['tft_fill_screen'] = function(block) {
  var color = block.getFieldValue('COLOR');
  return 'tft.fillScreen(' + color + ');\n';
};

generator.forBlock['tft_draw_text'] = function(block) {
  var text = generator.valueToCode(block, 'TEXT', generator.PRECEDENCE.ATOMIC) || '""';
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  var size = block.getFieldValue('SIZE');
  var color = block.getFieldValue('COLOR');
  
  return 'tft.setCursor(' + x + ', ' + y + ');\n' +
         '  tft.setTextSize(' + size + ');\n' +
         '  tft.setTextColor(' + color + ');\n' +
         '  tft.print(' + text + ');\n';
};

generator.forBlock['tft_draw_pixel'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  var color = block.getFieldValue('COLOR');
  return 'tft.drawPixel(' + x + ', ' + y + ', ' + color + ');\n';
};

generator.forBlock['tft_draw_line'] = function(block) {
  var x1 = generator.valueToCode(block, 'X1', generator.PRECEDENCE.ATOMIC) || '0';
  var y1 = generator.valueToCode(block, 'Y1', generator.PRECEDENCE.ATOMIC) || '0';
  var x2 = generator.valueToCode(block, 'X2', generator.PRECEDENCE.ATOMIC) || '10';
  var y2 = generator.valueToCode(block, 'Y2', generator.PRECEDENCE.ATOMIC) || '10';
  var color = block.getFieldValue('COLOR');
  return 'tft.drawLine(' + x1 + ', ' + y1 + ', ' + x2 + ', ' + y2 + ', ' + color + ');\n';
};

generator.forBlock['tft_draw_rect'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  var w = generator.valueToCode(block, 'W', generator.PRECEDENCE.ATOMIC) || '20';
  var h = generator.valueToCode(block, 'H', generator.PRECEDENCE.ATOMIC) || '10';
  var color = block.getFieldValue('COLOR');
  return 'tft.drawRect(' + x + ', ' + y + ', ' + w + ', ' + h + ', ' + color + ');\n';
};

generator.forBlock['tft_fill_rect'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '0';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '0';
  var w = generator.valueToCode(block, 'W', generator.PRECEDENCE.ATOMIC) || '20';
  var h = generator.valueToCode(block, 'H', generator.PRECEDENCE.ATOMIC) || '10';
  var color = block.getFieldValue('COLOR');
  return 'tft.fillRect(' + x + ', ' + y + ', ' + w + ', ' + h + ', ' + color + ');\n';
};

generator.forBlock['tft_draw_circle'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '120';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '120';
  var r = generator.valueToCode(block, 'R', generator.PRECEDENCE.ATOMIC) || '10';
  var color = block.getFieldValue('COLOR');
  return 'tft.drawCircle(' + x + ', ' + y + ', ' + r + ', ' + color + ');\n';
};

generator.forBlock['tft_fill_circle'] = function(block) {
  var x = generator.valueToCode(block, 'X', generator.PRECEDENCE.ATOMIC) || '120';
  var y = generator.valueToCode(block, 'Y', generator.PRECEDENCE.ATOMIC) || '120';
  var r = generator.valueToCode(block, 'R', generator.PRECEDENCE.ATOMIC) || '10';
  var color = block.getFieldValue('COLOR');
  return 'tft.fillCircle(' + x + ', ' + y + ', ' + r + ', ' + color + ');\n';
};
