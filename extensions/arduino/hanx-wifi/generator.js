generator.forBlock['wifi_init'] = function(block) {
  var ssid = generator.valueToCode(block, 'SSID', generator.PRECEDENCE.ATOMIC) || '""';
  var pwd = generator.valueToCode(block, 'PWD', generator.PRECEDENCE.ATOMIC) || '""';
  
  generator.addDefinition('include_wifi', '#include <WiFiS3.h>');
  
  return 'WiFi.begin(' + ssid + ', ' + pwd + ');\n';
};

generator.forBlock['wifi_status'] = function(block) {
  return ['WiFi.status()', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['wifi_is_connected'] = function(block) {
  return ['WiFi.status() == WL_CONNECTED', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['wifi_get_ip'] = function(block) {
  return ['WiFi.localIP().toString()', generator.PRECEDENCE.ATOMIC];
};

generator.forBlock['wifi_http_get'] = function(block) {
  var url = generator.valueToCode(block, 'URL', generator.PRECEDENCE.ATOMIC) || '""';
  
  generator.addDefinition('include_wifi', '#include <WiFiS3.h>');
  
  var code = '([](String url) {\n' +
             '  WiFiClient client;\n' +
             '  String host = url.substring(url.indexOf("//") + 2);\n' +
             '  int slashPos = host.indexOf("/");\n' +
             '  String path = "/";\n' +
             '  if (slashPos != -1) {\n' +
             '    path = host.substring(slashPos);\n' +
             '    host = host.substring(0, slashPos);\n' +
             '  }\n' +
             '  String result = "";\n' +
             '  if (client.connect(host.c_str(), 80)) {\n' +
             '    client.print("GET " + path + " HTTP/1.1\\r\\nHost: " + host + "\\r\\nConnection: close\\r\\n\\r\\n");\n' +
             '    while (client.connected() || client.available()) {\n' +
             '      if (client.available()) result += (char)client.read();\n' +
             '    }\n' +
             '    client.stop();\n' +
             '  }\n' +
             '  return result;\n' +
             '})(' + url + ')';
             
  return [code, generator.PRECEDENCE.ATOMIC];
};
