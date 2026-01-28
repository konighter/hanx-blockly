// generator.ts - Custom Blockly C++ generator for Arduino

import * as Blockly from 'blockly';

// Use any for the base generator to avoid protected member conflicts with custom properties
export const arduinoGenerator = new Blockly.Generator('Arduino') as any;

// Attach custom collections
arduinoGenerator.definitions_ = Object.create(null);
arduinoGenerator.setups_ = Object.create(null);
arduinoGenerator.loops_ = Object.create(null);

// Order of precedence
arduinoGenerator.PRECEDENCE = {
  ATOMIC: 0,
  HIGH: 1,
  ORDER_UNARY_POSTFIX: 1, // ++ --
  ORDER_UNARY_PREFIX: 2,  // ++ -- ! ~ - +
  ORDER_MULTIPLICATIVE: 3, // * / %
  ORDER_ADDITIVE: 4,       // + -
  ORDER_RELATIONAL: 6,     // < <= > >=
  ORDER_EQUALITY: 7,       // == !=
  ORDER_LOGICAL_AND: 11,   // &&
  ORDER_LOGICAL_OR: 12,    // ||
  ORDER_ATOMIC: 99,
};

arduinoGenerator.RESERVED_WORDS_ = 'setup,loop,if,else,for,while,switch,case,break,continue,return,void,int,long,float,double,char,byte,word,boolean,String,pinMode,digitalWrite,digitalRead,analogRead,analogWrite,delay,delayMicroseconds,millis,micros,Serial,Serial1,Serial2,Serial3,SerialUSB,Keyboard,Mouse,tone,noTone,pulseIn,pulseInLong,shiftOut,shiftIn,attachInterrupt,detachInterrupt,interrupts,noInterrupts,HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP';

// Initialize collections
arduinoGenerator.init = function(workspace: Blockly.Workspace) {
  this.definitions_ = Object.create(null);
  this.setups_ = Object.create(null);
  this.loops_ = Object.create(null);
  
  // Initialize variable database
  if (!this.nameDB_) {
    this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_);
  } else {
    this.nameDB_.reset();
  }

  // Set variable map to ensure we can resolve variable IDs to user names
  this.nameDB_.setVariableMap(workspace.getVariableMap());

  // Get all variables and declare them as global ints for Arduino
  const variables = workspace.getAllVariables();
  for (let i = 0; i < variables.length; i++) {
    const varName = this.nameDB_.getName(variables[i].getId(), 'VARIABLE');
    this.addDefinition('variable_' + varName, `int ${varName} = 0;`);
  }
};

// Collectors
arduinoGenerator.addSetup = function(name: string, code: string) {
  this.setups_[name] = code;
};

arduinoGenerator.addDefinition = function(name: string, code: string) {
  this.definitions_[name] = code;
};

arduinoGenerator.addLoop = function(name: string, code: string) {
  this.loops_[name] = code;
};

// Finalize code structure
arduinoGenerator.finish = function(code: string) {
  const definitions = [];
  const definitionKeys = Object.keys(this.definitions_).sort();
  for (let key of definitionKeys) {
    definitions.push(this.definitions_[key]);
  }
  
  const setups = [];
  const setupKeys = Object.keys(this.setups_).sort();
  for (let key of setupKeys) {
    const lines = this.setups_[key].split('\n');
    for (let line of lines) {
      setups.push('  ' + line);
    }
  }
  
  const allDefs = definitions.join('\n') + (definitions.length ? '\n\n' : '');
  const setupCode = `void setup() {\n${setups.join('\n')}\n}\n\n`;
  
  const loops = [];
  const loopKeys = Object.keys(this.loops_).sort();
  for (let key of loopKeys) {
    const lines = this.loops_[key].split('\n');
    for (let line of lines) {
      loops.push('  ' + line);
    }
  }

  const loopCode = `void loop() {\n${loops.join('\n')}${loops.length && code.trim() ? '\n' : ''}${code.split('\n').filter((l: string) => l).map((line: string) => '  ' + line).join('\n')}\n}\n`;
  
  return allDefs + setupCode + loopCode;
};

// Scrub helper for comments and next blocks
// @ts-ignore
arduinoGenerator.scrub_ = function(block, code, opt_thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const nextCode = opt_thisOnly ? '' : arduinoGenerator.blockToCode(nextBlock);
  return code + nextCode;
};


export const initArduinoGenerator = () => {
  // --- VARIABLE BLOCKS ---
  
  // @ts-ignore
  arduinoGenerator.forBlock['variables_get'] = function(block: Blockly.Block) {
    const code = arduinoGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
    return [code, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // @ts-ignore
  arduinoGenerator.forBlock['variables_set'] = function(block: Blockly.Block) {
    const argument0 = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const varName = arduinoGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
    return `${varName} = ${argument0};\n`;
  };

  // --- PROCEDURE BLOCKS ---

  // @ts-ignore
  arduinoGenerator.forBlock['procedures_defnoreturn'] = function(block: Blockly.Block) {
    const funcName = arduinoGenerator.nameDB_.getName(block.getFieldValue('NAME'), 'PROCEDURE');
    const branch = arduinoGenerator.statementToCode(block, 'STACK');
    const args = [];
    // @ts-ignore
    const variables = block.arguments_ || [];
    for (let i = 0; i < variables.length; i++) {
      args.push('int ' + arduinoGenerator.nameDB_.getName(variables[i], 'VARIABLE'));
    }
    const code = `void ${funcName}(${args.join(', ')}) {\n${branch}}\n`;
    arduinoGenerator.addDefinition(funcName, code);
    return '';
  };

  // @ts-ignore
  arduinoGenerator.forBlock['procedures_defreturn'] = function(block: Blockly.Block) {
    const funcName = arduinoGenerator.nameDB_.getName(block.getFieldValue('NAME'), 'PROCEDURE');
    const branch = arduinoGenerator.statementToCode(block, 'STACK');
    const returnValue = arduinoGenerator.valueToCode(block, 'RETURN', arduinoGenerator.PRECEDENCE.ATOMIC) || '';
    const args = [];
    // @ts-ignore
    const variables = block.arguments_ || [];
    for (let i = 0; i < variables.length; i++) {
      args.push('int ' + arduinoGenerator.nameDB_.getName(variables[i], 'VARIABLE'));
    }
    let code = `int ${funcName}(${args.join(', ')}) {\n${branch}`;
    if (returnValue) {
      code += `  return ${returnValue};\n`;
    }
    code += `}\n`;
    arduinoGenerator.addDefinition(funcName, code);
    return '';
  };

  // @ts-ignore
  arduinoGenerator.forBlock['procedures_callnoreturn'] = function(block: Blockly.Block) {
    const funcName = arduinoGenerator.nameDB_.getName(block.getFieldValue('NAME'), 'PROCEDURE');
    const args = [];
    // @ts-ignore
    const variables = block.arguments_ || [];
    for (let i = 0; i < variables.length; i++) {
      args[i] = arduinoGenerator.valueToCode(block, 'ARG' + i, arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    }
    return `${funcName}(${args.join(', ')});\n`;
  };

  // @ts-ignore
  arduinoGenerator.forBlock['procedures_callreturn'] = function(block: Blockly.Block) {
    const funcName = arduinoGenerator.nameDB_.getName(block.getFieldValue('NAME'), 'PROCEDURE');
    const args = [];
    // @ts-ignore
    const variables = block.arguments_ || [];
    for (let i = 0; i < variables.length; i++) {
      args[i] = arduinoGenerator.valueToCode(block, 'ARG' + i, arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    }
    return [`${funcName}(${args.join(', ')})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // --- TYPED PROCEDURE BLOCKS ---

  // @ts-ignore
  arduinoGenerator.forBlock['arduino_functions_defnoreturn'] = function(block: Blockly.Block) {
    const funcName = arduinoGenerator.nameDB_.getName(block.getFieldValue('NAME'), 'PROCEDURE');
    const branch = arduinoGenerator.statementToCode(block, 'STACK');
    const args = [];
    // @ts-ignore
    const variables = block.arguments_ || [];
    for (let i = 0; i < variables.length; i++) {
      args.push(variables[i].type + ' ' + arduinoGenerator.nameDB_.getName(variables[i].name, 'VARIABLE'));
    }
    const code = `void ${funcName}(${args.join(', ')}) {\n${branch}}\n`;
    arduinoGenerator.addDefinition(funcName, code);
    return '';
  };

  // @ts-ignore
  arduinoGenerator.forBlock['arduino_functions_defreturn'] = function(block: Blockly.Block) {
    const funcName = arduinoGenerator.nameDB_.getName(block.getFieldValue('NAME'), 'PROCEDURE');
    const returnType = block.getFieldValue('RETURN_TYPE') || 'int';
    const branch = arduinoGenerator.statementToCode(block, 'STACK');
    const returnValue = arduinoGenerator.valueToCode(block, 'RETURN', arduinoGenerator.PRECEDENCE.ATOMIC) || '';
    const args = [];
    // @ts-ignore
    const variables = block.arguments_ || [];
    for (let i = 0; i < variables.length; i++) {
        args.push(variables[i].type + ' ' + arduinoGenerator.nameDB_.getName(variables[i].name, 'VARIABLE'));
    }
    let code = `${returnType} ${funcName}(${args.join(', ')}) {\n${branch}`;
    if (returnValue) {
      code += `  return ${returnValue};\n`;
    }
    code += `}\n`;
    arduinoGenerator.addDefinition(funcName, code);
    return '';
  };

  // 1. Setup & Loop (Now just contributes to collections)
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_setup'] = function(block: Blockly.Block) {
    const setup = arduinoGenerator.statementToCode(block, 'SETUP');
    const loop = arduinoGenerator.statementToCode(block, 'LOOP');
    
    if (setup) {
      arduinoGenerator.addSetup('m_setup', setup.trim());
    }
    // Loop code from this block will be returned and wrapped by finish()
    return loop;
  };

  // 2. Digital Write
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_digital_write'] = function(block: Blockly.Block) {
    const pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.PRECEDENCE.ATOMIC) || '13';
    const state = arduinoGenerator.valueToCode(block, 'STATE', arduinoGenerator.PRECEDENCE.ATOMIC) || 'HIGH';
    
    arduinoGenerator.addSetup('pinMode_' + pin, `pinMode(${pin}, OUTPUT);`);
    return `digitalWrite(${pin}, ${state});\n`;
  };

  // 3. Digital Read
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_digital_read'] = function(block: Blockly.Block) {
    const pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.PRECEDENCE.ATOMIC) || '13';
    
    arduinoGenerator.addSetup('pinMode_' + pin, `pinMode(${pin}, INPUT);`);
    return [`digitalRead(${pin})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 4. Analog Write
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_analog_write'] = function(block: Blockly.Block) {
    const pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.PRECEDENCE.ATOMIC) || '3';
    const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    
    arduinoGenerator.addSetup('pinMode_' + pin, `pinMode(${pin}, OUTPUT);`);
    return `analogWrite(${pin}, ${value});\n`;
  };

  // 5. Analog Read
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_analog_read'] = function(block: Blockly.Block) {
    const pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.PRECEDENCE.ATOMIC) || 'A0';
    
    // Analog input doesn't strictly need pinMode on AVR, but good for consistency or if using as digital
    arduinoGenerator.addSetup('pinMode_' + pin, `pinMode(${pin}, INPUT);`);
    return [`analogRead(${pin})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 6. High/Low
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_highlow'] = function(block: Blockly.Block) {
    const state = block.getFieldValue('STATE');
    return [state, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 7. Hardware Interrupt
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_interrupt'] = function(block: Blockly.Block) {
    const pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.PRECEDENCE.ATOMIC) || '2';
    const mode = block.getFieldValue('MODE');
    const branch = arduinoGenerator.statementToCode(block, 'DO');
    
    const functionName = 'onInterrupt_' + pin;
    arduinoGenerator.addDefinition(functionName, `void ${functionName}() {\n${branch}}\n`);
    arduinoGenerator.addSetup('interrupt_' + pin, `attachInterrupt(digitalPinToInterrupt(${pin}), ${functionName}, ${mode});`);
    return '';
  };

  // 8. Detach Interrupt
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_detach_interrupt'] = function(block: Blockly.Block) {
    const pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.PRECEDENCE.ATOMIC) || '2';
    return `detachInterrupt(digitalPinToInterrupt(${pin}));\n`;
  };

  // 9. Pulse In
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_pulse_in'] = function(block: Blockly.Block) {
    const pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.PRECEDENCE.ATOMIC) || '7';
    const state = arduinoGenerator.valueToCode(block, 'STATE', arduinoGenerator.PRECEDENCE.ATOMIC) || 'HIGH';
    return [`pulseIn(${pin}, ${state})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 10. Pulse In with Timeout
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_pulse_in_timeout'] = function(block: Blockly.Block) {
    const pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.PRECEDENCE.ATOMIC) || '7';
    const state = arduinoGenerator.valueToCode(block, 'STATE', arduinoGenerator.PRECEDENCE.ATOMIC) || 'HIGH';
    const timeout = arduinoGenerator.valueToCode(block, 'TIMEOUT', arduinoGenerator.PRECEDENCE.ATOMIC) || '1000000';
    return [`pulseIn(${pin}, ${state}, ${timeout})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 11. Tone
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_tone'] = function(block: Blockly.Block) {
    const pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.PRECEDENCE.ATOMIC) || '9';
    const freq = arduinoGenerator.valueToCode(block, 'FREQ', arduinoGenerator.PRECEDENCE.ATOMIC) || '440';
    const duration = arduinoGenerator.valueToCode(block, 'DURATION', arduinoGenerator.PRECEDENCE.ATOMIC) || '1000';
    return `tone(${pin}, ${freq}, ${duration});\n`;
  };

  // 12. NoTone
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_notone'] = function(block: Blockly.Block) {
    const pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.PRECEDENCE.ATOMIC) || '9';
    return `noTone(${pin});\n`;
  };

  // 13. ShiftOut
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_shiftout'] = function(block: Blockly.Block) {
    const data = arduinoGenerator.valueToCode(block, 'DATA', arduinoGenerator.PRECEDENCE.ATOMIC) || '11';
    const clock = arduinoGenerator.valueToCode(block, 'CLOCK', arduinoGenerator.PRECEDENCE.ATOMIC) || '12';
    const order = block.getFieldValue('ORDER');
    const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    
    arduinoGenerator.addSetup('pinMode_data_' + data, `pinMode(${data}, OUTPUT);`);
    arduinoGenerator.addSetup('pinMode_clock_' + clock, `pinMode(${clock}, OUTPUT);`);
    return `shiftOut(${data}, ${clock}, ${order}, ${value});\n`;
  };

  // 14. PinMode
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_pin_mode'] = function(block: Blockly.Block) {
    const pin = arduinoGenerator.valueToCode(block, 'PIN', arduinoGenerator.PRECEDENCE.ATOMIC) || '13';
    const mode = block.getFieldValue('MODE');
    return `pinMode(${pin}, ${mode});\n`;
  };

  // 15. Delay
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_delay'] = function(block: Blockly.Block) {
    const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || '1000';
    const unit = block.getFieldValue('UNIT');
    return unit === 'ms' ? `delay(${value});\n` : `delayMicroseconds(${value});\n`;
  };

  // 16. System Time
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_system_time'] = function(block: Blockly.Block) {
    const unit = block.getFieldValue('UNIT');
    return [unit === 'ms' ? 'millis()' : 'micros()', arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 17. Global Interrupts
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_interrupt_control'] = function(block: Blockly.Block) {
    const action = block.getFieldValue('ACTION');
    return `${action}();\n`;
  };

  // 18. MsTimer2 Setup
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_mstimer2_setup'] = function(block: Blockly.Block) {
    const time = arduinoGenerator.valueToCode(block, 'TIME', arduinoGenerator.PRECEDENCE.ATOMIC) || '500';
    const branch = arduinoGenerator.statementToCode(block, 'DO');
    const functionName = 'mstimer2_handler';
    
    arduinoGenerator.addDefinition('MsTimer2_include', '#include <MsTimer2.h>');
    arduinoGenerator.addDefinition(functionName, `void ${functionName}() {\n${branch}}\n`);
    arduinoGenerator.addSetup('MsTimer2_setup', `MsTimer2::set(${time}, ${functionName});`);
    return '';
  };

  // 19. MsTimer2 Start/Stop
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_mstimer2_control'] = function(block: Blockly.Block) {
    const action = block.getFieldValue('ACTION');
    arduinoGenerator.addDefinition('MsTimer2_include', '#include <MsTimer2.h>');
    return `MsTimer2::${action}();\n`;
  };

  // 20. SCoop Task
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_scoop_task'] = function(block: Blockly.Block) {
    const name = block.getFieldValue('NAME');
    const setup = arduinoGenerator.statementToCode(block, 'SETUP');
    const loop = arduinoGenerator.statementToCode(block, 'LOOP');
    
    arduinoGenerator.addDefinition('SCoop_include', '#include <SCoop.h>');
    arduinoGenerator.addDefinition('SCoop_task_' + name, `defineTask(${name});\n\nvoid ${name}::setup() {\n${setup}}\n\nvoid ${name}::loop() {\n${loop}}\n`);
    arduinoGenerator.addSetup('SCoop_start', 'mySCoop.start();');
    return '';
  };

  // 21. SCoop Yield
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_scoop_yield'] = function(_block: Blockly.Block) {
    arduinoGenerator.addDefinition('SCoop_include', '#include <SCoop.h>');
    return 'yield();\n';
  };

  // 22. SCoop Sleep
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_scoop_sleep'] = function(block: Blockly.Block) {
    const time = arduinoGenerator.valueToCode(block, 'TIME', arduinoGenerator.PRECEDENCE.ATOMIC) || '1000';
    arduinoGenerator.addDefinition('SCoop_include', '#include <SCoop.h>');
    return `sleep(${time});\n`;
  };

  // --- STANDARD BLOCKS ---

  // 23. Controls IF
  // @ts-ignore
  arduinoGenerator.forBlock['controls_if'] = function(block: Blockly.Block) {
    let n = 0;
    let code = '';
    do {
      const conditionCode = arduinoGenerator.valueToCode(block, 'IF' + n, arduinoGenerator.PRECEDENCE.ATOMIC) || 'false';
      const branchCode = arduinoGenerator.statementToCode(block, 'DO' + n);
      code += (n > 0 ? ' else ' : '') + `if (${conditionCode}) {\n${branchCode}}`;
      n++;
    } while (block.getInput('IF' + n));

    if (block.getInput('ELSE')) {
      const branchCode = arduinoGenerator.statementToCode(block, 'ELSE');
      code += ` else {\n${branchCode}}`;
    }
    return code + '\n';
  };

  // 24. Repeat
  // @ts-ignore
  arduinoGenerator.forBlock['controls_repeat_ext'] = function(block: Blockly.Block) {
    const repeats = arduinoGenerator.valueToCode(block, 'TIMES', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const branch = arduinoGenerator.statementToCode(block, 'DO');
    const loopVar = arduinoGenerator.nameDB_.getDistinctName('count', 'VARIABLE');
    return `for (int ${loopVar} = 0; ${loopVar} < ${repeats}; ${loopVar}++) {\n${branch}}\n`;
  };

  // 25. While/Until
  // @ts-ignore
  arduinoGenerator.forBlock['controls_whileUntil'] = function(block: Blockly.Block) {
    const until = block.getFieldValue('MODE') === 'UNTIL';
    let argument0 = arduinoGenerator.valueToCode(block, 'BOOL', arduinoGenerator.PRECEDENCE.ATOMIC) || 'false';
    const branch = arduinoGenerator.statementToCode(block, 'DO');
    if (until) {
      argument0 = '!' + argument0;
    }
    return `while (${argument0}) {\n${branch}}\n`;
  };

  // 26. For
  // @ts-ignore
  arduinoGenerator.forBlock['controls_for'] = function(block: Blockly.Block) {
    const variable0 = arduinoGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
    const argument0 = arduinoGenerator.valueToCode(block, 'FROM', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const argument1 = arduinoGenerator.valueToCode(block, 'TO', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const increment = arduinoGenerator.valueToCode(block, 'BY', arduinoGenerator.PRECEDENCE.ATOMIC) || '1';
    const branch = arduinoGenerator.statementToCode(block, 'DO');
    
    // Simplification: assume int and step > 0
    return `for (${variable0} = ${argument0}; ${variable0} <= ${argument1}; ${variable0} += ${increment}) {\n${branch}}\n`;
  };

  // 27. Break/Continue
  // @ts-ignore
  arduinoGenerator.forBlock['controls_flow_statements'] = function(block: Blockly.Block) {
    switch (block.getFieldValue('FLOW')) {
      case 'BREAK': return 'break;\n';
      case 'CONTINUE': return 'continue;\n';
    }
    return '';
  };

  // 28. Logic Compare
  // @ts-ignore
  arduinoGenerator.forBlock['logic_compare'] = function(block: Blockly.Block) {
    const OPERATORS: { [key: string]: string } = {
      'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>='
    };
    const operator = OPERATORS[block.getFieldValue('OP')];
    const argument0 = arduinoGenerator.valueToCode(block, 'A', arduinoGenerator.PRECEDENCE.ORDER_RELATIONAL) || '0';
    const argument1 = arduinoGenerator.valueToCode(block, 'B', arduinoGenerator.PRECEDENCE.ORDER_RELATIONAL) || '0';
    return [`${argument0} ${operator} ${argument1}`, arduinoGenerator.PRECEDENCE.ORDER_RELATIONAL];
  };

  // 29. Logic Operation
  // @ts-ignore
  arduinoGenerator.forBlock['logic_operation'] = function(block: Blockly.Block) {
    const operator = (block.getFieldValue('OP') === 'AND') ? '&&' : '||';
    const order = (operator === '&&') ? arduinoGenerator.PRECEDENCE.ORDER_LOGICAL_AND : arduinoGenerator.PRECEDENCE.ORDER_LOGICAL_OR;
    const argument0 = arduinoGenerator.valueToCode(block, 'A', order) || 'false';
    const argument1 = arduinoGenerator.valueToCode(block, 'B', order) || 'false';
    return [`${argument0} ${operator} ${argument1}`, order];
  };

  // 30. Logic Negate
  // @ts-ignore
  arduinoGenerator.forBlock['logic_negate'] = function(block: Blockly.Block) {
    const argument0 = arduinoGenerator.valueToCode(block, 'BOOL', arduinoGenerator.PRECEDENCE.ORDER_UNARY_PREFIX) || 'true';
    return [`!${argument0}`, arduinoGenerator.PRECEDENCE.ORDER_UNARY_PREFIX];
  };

  // 31. Logic Boolean
  // @ts-ignore
  arduinoGenerator.forBlock['logic_boolean'] = function(block: Blockly.Block) {
    return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 32. Math Number
  // @ts-ignore
  arduinoGenerator.forBlock['math_number'] = function(block: Blockly.Block) {
    const code = block.getFieldValue('NUM');
    return [code, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 33. Math Arithmetic
  // @ts-ignore
  arduinoGenerator.forBlock['math_arithmetic'] = function(block: Blockly.Block) {
    const OPERATORS: { [key: string]: [string | null, number] } = {
      'ADD': [' + ', arduinoGenerator.PRECEDENCE.ORDER_ADDITIVE],
      'MINUS': [' - ', arduinoGenerator.PRECEDENCE.ORDER_ADDITIVE],
      'MULTIPLY': [' * ', arduinoGenerator.PRECEDENCE.ORDER_MULTIPLICATIVE],
      'DIVIDE': [' / ', arduinoGenerator.PRECEDENCE.ORDER_MULTIPLICATIVE],
      'MODULO': [' % ', arduinoGenerator.PRECEDENCE.ORDER_MULTIPLICATIVE],
      'POWER': [null, arduinoGenerator.PRECEDENCE.ATOMIC]
    };
    const tuple = OPERATORS[block.getFieldValue('OP')];
    const operator = tuple[0];
    const order = tuple[1];
    const argument0 = arduinoGenerator.valueToCode(block, 'A', order) || '0';
    const argument1 = arduinoGenerator.valueToCode(block, 'B', order) || '0';
    if (operator === null) {
      return [`pow(${argument0}, ${argument1})`, arduinoGenerator.PRECEDENCE.ATOMIC];
    }
    return [`${argument0}${operator}${argument1}`, order];
  };

  // 34. Serial Print
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_serial_print'] = function(block: Blockly.Block) {
    const content = arduinoGenerator.valueToCode(block, 'CONTENT', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    arduinoGenerator.addSetup('00_serial_begin', 'Serial.begin(9600);');
    return `Serial.print(${content});\n`;
  };

  // 35. Serial Println
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_serial_println'] = function(block: Blockly.Block) {
    const content = arduinoGenerator.valueToCode(block, 'CONTENT', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    arduinoGenerator.addSetup('00_serial_begin', 'Serial.begin(9600);');
    return `Serial.println(${content});\n`;
  };

  // 36. Serial Available
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_serial_available'] = function(_block: Blockly.Block) {
    arduinoGenerator.addSetup('00_serial_begin', 'Serial.begin(9600);');
    return ['Serial.available() > 0', arduinoGenerator.PRECEDENCE.ORDER_RELATIONAL];
  };

  // 37. Serial Read
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_serial_read'] = function(_block: Blockly.Block) {
    arduinoGenerator.addSetup('00_serial_begin', 'Serial.begin(9600);');
    return ['Serial.read()', arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 38. Math Random
  // @ts-ignore
  arduinoGenerator.forBlock['math_random_int'] = function(block: Blockly.Block) {
    const from = arduinoGenerator.valueToCode(block, 'FROM', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const to = arduinoGenerator.valueToCode(block, 'TO', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    return [`random(${from}, ${to} + 1)`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 39. Text
  // @ts-ignore
  arduinoGenerator.forBlock['text'] = function(block: Blockly.Block) {
    const code = JSON.stringify(block.getFieldValue('TEXT'));
    return [code, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 40. Text Join
  // @ts-ignore
  arduinoGenerator.forBlock['text_join'] = function(block: Blockly.Block) {
    // @ts-ignore
    const n = block.itemCount_;
    const args = [];
    for (let i = 0; i < n; i++) {
        args[i] = arduinoGenerator.valueToCode(block, 'ADD' + i, arduinoGenerator.PRECEDENCE.ORDER_ADDITIVE) || '""';
    }
    const code = args.length === 0 ? '""' : args.map(arg => `String(${arg})`).join(' + ');
    return [code, arduinoGenerator.PRECEDENCE.ORDER_ADDITIVE];
  };

  // 41. Text Append
  // @ts-ignore
  arduinoGenerator.forBlock['text_append'] = function(block: Blockly.Block) {
    const varName = arduinoGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
    const value = arduinoGenerator.valueToCode(block, 'TEXT', arduinoGenerator.PRECEDENCE.ORDER_ADDITIVE) || '""';
    return `${varName} += String(${value});\n`;
  };

  // 42. Text Length
  // @ts-ignore
  arduinoGenerator.forBlock['text_length'] = function(block: Blockly.Block) {
    const text = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    return [`String(${text}).length()`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 43. Text Is Empty
  // @ts-ignore
  arduinoGenerator.forBlock['text_isEmpty'] = function(block: Blockly.Block) {
    const text = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    return [`String(${text}).length() == 0`, arduinoGenerator.PRECEDENCE.ORDER_RELATIONAL];
  };

  // 44. Text IndexOf
  // @ts-ignore
  arduinoGenerator.forBlock['text_indexOf'] = function(block: Blockly.Block) {
    const text = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    const find = arduinoGenerator.valueToCode(block, 'FIND', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    return [`String(${text}).indexOf(String(${find}))`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 45. Text CharAt
  // @ts-ignore
  arduinoGenerator.forBlock['text_charAt'] = function(block: Blockly.Block) {
    const text = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    const at = arduinoGenerator.valueToCode(block, 'AT', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    return [`String(${text}).charAt(${at})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 46. Text Get Substring
  // @ts-ignore
  arduinoGenerator.forBlock['text_getSubstring'] = function(block: Blockly.Block) {
    const text = arduinoGenerator.valueToCode(block, 'STRING', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    const at1 = arduinoGenerator.valueToCode(block, 'AT1', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const at2 = arduinoGenerator.valueToCode(block, 'AT2', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    return [`String(${text}).substring(${at1}, ${at2})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 47. Text Change Case
  // @ts-ignore
  arduinoGenerator.forBlock['text_changeCase'] = function(block: Blockly.Block) {
    const text = arduinoGenerator.valueToCode(block, 'TEXT', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    const mode = block.getFieldValue('CASE');
    const method = (mode === 'UPPERCASE') ? 'toUpperCase' : 'toLowerCase';
    return [`({ String _s = String(${text}); _s.${method}(); _s; })`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 48. Text Trim
  // @ts-ignore
  arduinoGenerator.forBlock['text_trim'] = function(block: Blockly.Block) {
    const text = arduinoGenerator.valueToCode(block, 'TEXT', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    return [`({ String _s = String(${text}); _s.trim(); _s; })`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 49. Text to Int
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_text_toInt'] = function(block: Blockly.Block) {
    const text = arduinoGenerator.valueToCode(block, 'TEXT', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    return [`String(${text}).toInt()`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 50. Text to Float
  // @ts-ignore
  arduinoGenerator.forBlock['arduino_text_toFloat'] = function(block: Blockly.Block) {
    const text = arduinoGenerator.valueToCode(block, 'TEXT', arduinoGenerator.PRECEDENCE.ATOMIC) || '""';
    return [`String(${text}).toFloat()`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 51. Math Map
  // @ts-ignore
  arduinoGenerator.forBlock['math_map'] = function(block: Blockly.Block) {
    const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const fromLow = arduinoGenerator.valueToCode(block, 'FROMLOW', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const fromHigh = arduinoGenerator.valueToCode(block, 'FROMHIGH', arduinoGenerator.PRECEDENCE.ATOMIC) || '1023';
    const toLow = arduinoGenerator.valueToCode(block, 'TOLOW', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const toHigh = arduinoGenerator.valueToCode(block, 'TOHIGH', arduinoGenerator.PRECEDENCE.ATOMIC) || '255';
    return [`map(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 52. Math Constrain
  // @ts-ignore
  arduinoGenerator.forBlock['math_constrain'] = function(block: Blockly.Block) {
    const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const low = arduinoGenerator.valueToCode(block, 'LOW', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const high = arduinoGenerator.valueToCode(block, 'HIGH', arduinoGenerator.PRECEDENCE.ATOMIC) || '255';
    return [`constrain(${value}, ${low}, ${high})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 53. Math Random Seed
  // @ts-ignore
  arduinoGenerator.forBlock['math_random_seed'] = function(block: Blockly.Block) {
    const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    return `randomSeed(${value});\n`;
  };

  // 54. Math Single (sqrt, abs, etc.)
  // @ts-ignore
  arduinoGenerator.forBlock['math_single'] = function(block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    let code;
    let arg;
    if (operator === 'NEG') {
      arg = arduinoGenerator.valueToCode(block, 'NUM', arduinoGenerator.PRECEDENCE.ORDER_UNARY_PREFIX) || '0';
      return [`-${arg}`, arduinoGenerator.PRECEDENCE.ORDER_UNARY_PREFIX];
    }
    arg = arduinoGenerator.valueToCode(block, 'NUM', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    switch (operator) {
      case 'ABS': code = `abs(${arg})`; break;
      case 'ROOT': code = `sqrt(${arg})`; break;
      case 'LN': code = `log(${arg})`; break;
      case 'LOG10': code = `log10(${arg})`; break;
      case 'EXP': code = `exp(${arg})`; break;
      case 'POW10': code = `pow(10, ${arg})`; break;
      case 'ROUND': code = `round(${arg})`; break;
      case 'ROUNDUP': code = `ceil(${arg})`; break;
      case 'ROUNDDOWN': code = `floor(${arg})`; break;
      default: code = arg;
    }
    return [code, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 55. Math Trig
  // @ts-ignore
  arduinoGenerator.forBlock['math_trig'] = function(block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    const arg = arduinoGenerator.valueToCode(block, 'NUM', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    let code;
    switch (operator) {
      case 'SIN': code = `sin(${arg})`; break;
      case 'COS': code = `cos(${arg})`; break;
      case 'TAN': code = `tan(${arg})`; break;
      case 'ASIN': code = `asin(${arg})`; break;
      case 'ACOS': code = `acos(${arg})`; break;
      case 'ATAN': code = `atan(${arg})`; break;
      default: code = arg;
    }
    return [code, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 56. Math Round (Blockly also has math_round block)
  // @ts-ignore
  arduinoGenerator.forBlock['math_round'] = function(block: Blockly.Block) {
    const operator = block.getFieldValue('OP');
    const arg = arduinoGenerator.valueToCode(block, 'NUM', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    let code;
    switch (operator) {
      case 'ROUND': code = `round(${arg})`; break;
      case 'ROUNDUP': code = `ceil(${arg})`; break;
      case 'ROUNDDOWN': code = `floor(${arg})`; break;
      default: code = arg;
    }
    return [code, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 57. Math Constant
  // @ts-ignore
  arduinoGenerator.forBlock['math_constant'] = function(block: Blockly.Block) {
    const constant = block.getFieldValue('CONSTANT');
    const constants: { [key: string]: string } = {
      'PI': 'PI',
      'E': '2.718281828459',
      'GOLDEN_RATIO': '1.61803398875',
      'SQRT2': '1.41421356237',
      'SQRT1_2': '0.70710678118',
      'INFINITY': 'INFINITY'
    };
    return [constants[constant], arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 58. Math Factorial
  // @ts-ignore
  arduinoGenerator.forBlock['math_factorial'] = function(block: Blockly.Block) {
    const num = arduinoGenerator.valueToCode(block, 'NUM', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    arduinoGenerator.addDefinition('func_factorial', 
`long factorial(int n) {
  if (n <= 1) return 1;
  long res = 1;
  for (int i = 2; i <= n; i++) res *= i;
  return res;
}`);
    return [`factorial(${num})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 59. Math GCD
  // @ts-ignore
  arduinoGenerator.forBlock['math_gcd'] = function(block: Blockly.Block) {
    const a = arduinoGenerator.valueToCode(block, 'A', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const b = arduinoGenerator.valueToCode(block, 'B', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    arduinoGenerator.addDefinition('func_gcd', 
`int gcd(int a, int b) {
  while (b) {
    a %= b;
    int t = a; a = b; b = t;
  }
  return a;
}`);
    return [`gcd(${a}, ${b})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 60. Math LCM
  // @ts-ignore
  arduinoGenerator.forBlock['math_lcm'] = function(block: Blockly.Block) {
    const a = arduinoGenerator.valueToCode(block, 'A', arduinoGenerator.PRECEDENCE.ATOMIC) || '1';
    const b = arduinoGenerator.valueToCode(block, 'B', arduinoGenerator.PRECEDENCE.ATOMIC) || '1';
    arduinoGenerator.addDefinition('func_gcd', 
`int gcd(int a, int b) {
  while (b) {
    a %= b;
    int t = a; a = b; b = t;
  }
  return a;
}`);
    return [`((${a} * ${b}) / gcd(${a}, ${b}))`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 61. Math Prime Check
  // @ts-ignore
  arduinoGenerator.forBlock['math_prime_check'] = function(block: Blockly.Block) {
    const num = arduinoGenerator.valueToCode(block, 'NUM', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    arduinoGenerator.addDefinition('func_isPrime', 
`boolean isPrime(int n) {
  if (n <= 1) return false;
  for (int i = 2; i * i <= n; i++) {
    if (n % i == 0) return false;
  }
  return true;
}`);
    return [`isPrime(${num})`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 62. Lists Create With
  // @ts-ignore
  arduinoGenerator.forBlock['lists_create_with'] = function(block: Blockly.Block) {
    // @ts-ignore
    const n = block.itemCount_ || 0;
    const elements = new Array(n);
    for (let i = 0; i < n; i++) {
      elements[i] = arduinoGenerator.valueToCode(block, 'ADD' + i, arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    }
    const code = '{' + elements.join(', ') + '}';
    return [code, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 63. Lists Get Index
  // @ts-ignore
  arduinoGenerator.forBlock['lists_getIndex'] = function(block: Blockly.Block) {
    const list = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || 'mylist';
    const at = arduinoGenerator.valueToCode(block, 'AT', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    // Simplified: assume simple array variable and 0-based index
    return [`${list}[${at}]`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 64. Lists Set Index
  // @ts-ignore
  arduinoGenerator.forBlock['lists_setIndex'] = function(block: Blockly.Block) {
    const list = arduinoGenerator.valueToCode(block, 'LIST', arduinoGenerator.PRECEDENCE.ATOMIC) || 'mylist';
    const at = arduinoGenerator.valueToCode(block, 'AT', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    const value = arduinoGenerator.valueToCode(block, 'TO', arduinoGenerator.PRECEDENCE.ATOMIC) || '0';
    return `${list}[${at}] = ${value};\n`;
  };

  // 65. Lists Length
  // @ts-ignore
  arduinoGenerator.forBlock['lists_length'] = function(block: Blockly.Block) {
    const list = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.PRECEDENCE.ATOMIC) || 'mylist';
    // In C++, we can't easily get the length of an arbitrary pointer/array passed this way.
    // However, we can use a "trick" if it's a fixed size array in the same scope, but here it's likely a global pointer.
    // For now, return a placeholder or implement a more robust way if possible.
    // Since this is a "perfecting" task, I'll use a semi-useful placeholder or a comment.
    return [`(sizeof(${list}) / sizeof(${list}[0]))`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 66. Array Sum
  // @ts-ignore
  arduinoGenerator.forBlock['math_array_sum'] = function(block: Blockly.Block) {
    const list = arduinoGenerator.valueToCode(block, 'LIST', arduinoGenerator.PRECEDENCE.ATOMIC) || 'mylist';
    arduinoGenerator.addDefinition('func_arraySum', 
`float arraySum(int arr[], int size) {
  float sum = 0;
  for (int i = 0; i < size; i++) sum += arr[i];
  return sum;
}`);
    return [`arraySum(${list}, sizeof(${list})/sizeof(${list}[0]))`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 67. Array Mean
  // @ts-ignore
  arduinoGenerator.forBlock['math_array_mean'] = function(block: Blockly.Block) {
    const list = arduinoGenerator.valueToCode(block, 'LIST', arduinoGenerator.PRECEDENCE.ATOMIC) || 'mylist';
    arduinoGenerator.addDefinition('func_arrayMean', 
`float arrayMean(int arr[], int size) {
  if (size == 0) return 0;
  float sum = 0;
  for (int i = 0; i < size; i++) sum += arr[i];
  return sum / size;
}`);
    return [`arrayMean(${list}, sizeof(${list})/sizeof(${list}[0]))`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 68. Array Max
  // @ts-ignore
  arduinoGenerator.forBlock['math_array_max'] = function(block: Blockly.Block) {
    const list = arduinoGenerator.valueToCode(block, 'LIST', arduinoGenerator.PRECEDENCE.ATOMIC) || 'mylist';
    arduinoGenerator.addDefinition('func_arrayMax', 
`int arrayMax(int arr[], int size) {
  if (size == 0) return 0;
  int maxVal = arr[0];
  for (int i = 1; i < size; i++) if (arr[i] > maxVal) maxVal = arr[i];
  return maxVal;
}`);
    return [`arrayMax(${list}, sizeof(${list})/sizeof(${list}[0]))`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 69. Array Min
  // @ts-ignore
  arduinoGenerator.forBlock['math_array_min'] = function(block: Blockly.Block) {
    const list = arduinoGenerator.valueToCode(block, 'LIST', arduinoGenerator.PRECEDENCE.ATOMIC) || 'mylist';
    arduinoGenerator.addDefinition('func_arrayMin', 
`int arrayMin(int arr[], int size) {
  if (size == 0) return 0;
  int minVal = arr[0];
  for (int i = 1; i < size; i++) if (arr[i] < minVal) minVal = arr[i];
  return minVal;
}`);
    return [`arrayMin(${list}, sizeof(${list})/sizeof(${list}[0]))`, arduinoGenerator.PRECEDENCE.ATOMIC];
  };

  // 70. Math Modulo
  // @ts-ignore
  arduinoGenerator.forBlock['math_modulo'] = function(block: Blockly.Block) {
    const dividend = arduinoGenerator.valueToCode(block, 'DIVIDEND', arduinoGenerator.PRECEDENCE.ORDER_MULTIPLICATIVE) || '0';
    const divisor = arduinoGenerator.valueToCode(block, 'DIVISOR', arduinoGenerator.PRECEDENCE.ORDER_MULTIPLICATIVE) || '1';
    return [`(${dividend} % ${divisor})`, arduinoGenerator.PRECEDENCE.ORDER_MULTIPLICATIVE];
  };

  return arduinoGenerator;
};
