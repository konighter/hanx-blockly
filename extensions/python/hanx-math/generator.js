// HanX Advanced Math Extension - Python Code Generator
// This file is executed in a context with 'generator' and 'Blockly' available

generator.forBlock['math_factorial'] = function(block) {
  generator.definitions_['import_math'] = 'import math';
  var num = generator.valueToCode(block, 'NUM', 3) || '0';
  return ['math.factorial(int(' + num + '))', 3];
};

generator.forBlock['math_gcd'] = function(block) {
  generator.definitions_['import_math'] = 'import math';
  var a = generator.valueToCode(block, 'A', 3) || '0';
  var b = generator.valueToCode(block, 'B', 3) || '0';
  return ['math.gcd(int(' + a + '), int(' + b + '))', 3];
};

generator.forBlock['math_lcm'] = function(block) {
  generator.definitions_['import_math'] = 'import math';
  var a = generator.valueToCode(block, 'A', 3) || '0';
  var b = generator.valueToCode(block, 'B', 3) || '0';
  return ['math.lcm(int(' + a + '), int(' + b + '))', 3];
};

generator.forBlock['math_prime_check'] = function(block) {
  // Define helper function
  generator.definitions_['func_is_prime'] = 
`def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True`;
  var num = generator.valueToCode(block, 'NUM', 3) || '0';
  return ['is_prime(int(' + num + '))', 3];
};

generator.forBlock['math_fibonacci'] = function(block) {
  // Define helper function
  generator.definitions_['func_fibonacci'] = 
`def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        a, b = 0, 1
        for _ in range(2, n + 1):
            a, b = b, a + b
        return b`;
  var n = generator.valueToCode(block, 'N', 3) || '0';
  return ['fibonacci(int(' + n + '))', 3];
};

generator.forBlock['math_sin'] = function(block) {
  generator.definitions_['import_math'] = 'import math';
  var angle = generator.valueToCode(block, 'ANGLE', 3) || '0';
  return ['math.sin(' + angle + ')', 3];
};

generator.forBlock['math_cos'] = function(block) {
  generator.definitions_['import_math'] = 'import math';
  var angle = generator.valueToCode(block, 'ANGLE', 3) || '0';
  return ['math.cos(' + angle + ')', 3];
};

generator.forBlock['math_tan'] = function(block) {
  generator.definitions_['import_math'] = 'import math';
  var angle = generator.valueToCode(block, 'ANGLE', 3) || '0';
  return ['math.tan(' + angle + ')', 3];
};

generator.forBlock['math_log'] = function(block) {
  generator.definitions_['import_math'] = 'import math';
  var value = generator.valueToCode(block, 'VALUE', 3) || '1';
  var base = generator.valueToCode(block, 'BASE', 3) || '10';
  return ['math.log(' + value + ', ' + base + ')', 3];
};

generator.forBlock['math_exp'] = function(block) {
  generator.definitions_['import_math'] = 'import math';
  var power = generator.valueToCode(block, 'POWER', 3) || '0';
  return ['math.exp(' + power + ')', 3];
};

generator.forBlock['math_array_sum'] = function(block) {
  var list = generator.valueToCode(block, 'LIST', 3) || '[]';
  return ['sum(' + list + ')', 3];
};

generator.forBlock['math_array_mean'] = function(block) {
  generator.definitions_['import_statistics'] = 'import statistics';
  var list = generator.valueToCode(block, 'LIST', 3) || '[]';
  return ['statistics.mean(' + list + ')', 3];
};

generator.forBlock['math_array_max'] = function(block) {
  var list = generator.valueToCode(block, 'LIST', 3) || '[]';
  return ['max(' + list + ')', 3];
};

generator.forBlock['math_array_min'] = function(block) {
  var list = generator.valueToCode(block, 'LIST', 3) || '[]';
  return ['min(' + list + ')', 3];
};

generator.forBlock['math_degree_to_radian'] = function(block) {
  generator.definitions_['import_math'] = 'import math';
  var degree = generator.valueToCode(block, 'DEGREE', 3) || '0';
  return ['math.radians(' + degree + ')', 3];
};

generator.forBlock['math_radian_to_degree'] = function(block) {
  generator.definitions_['import_math'] = 'import math';
  var radian = generator.valueToCode(block, 'RADIAN', 3) || '0';
  return ['math.degrees(' + radian + ')', 3];
};
