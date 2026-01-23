import * as Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';

export const initPythonGenerator = () => {
  // Define custom Python blocks if needed here
  
  // For example, an input() block
  // @ts-ignore
  Blockly.Blocks['python_input'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("input")
          .appendField(new Blockly.FieldTextInput("prompt"), "PROMPT");
      this.setOutput(true, "String");
      this.setColour(160);
      this.setTooltip("Read a string from standard input.");
      this.setHelpUrl("");
    }
  };

  // @ts-ignore
  pythonGenerator.forBlock['python_input'] = function(block: Blockly.Block) {
    const prompt = block.getFieldValue('PROMPT');
    const code = `input("${prompt}")`;
    return [code, 3]; // Order Atomics
  };

  // @ts-ignore
  pythonGenerator.forBlock['python_tuple'] = function(block: Blockly.Block) {
    const items = pythonGenerator.valueToCode(block, 'ITEMS', 99) || '[]';
    const code = `tuple(${items})`;
    return [code, 3];
  };

  // @ts-ignore
  pythonGenerator.forBlock['dicts_create_with'] = function(_block: Blockly.Block) {
    return ['{}', 3];
  };

  // @ts-ignore
  pythonGenerator.forBlock['dict_get'] = function(block: Blockly.Block) {
    const dict = pythonGenerator.valueToCode(block, 'DICT', 99) || '{}';
    const key = pythonGenerator.valueToCode(block, 'KEY', 99) || 'None';
    const code = `${dict}.get(${key})`;
    return [code, 3];
  };

  // @ts-ignore
  pythonGenerator.forBlock['python_range'] = function(block: Blockly.Block) {
    const from = pythonGenerator.valueToCode(block, 'FROM', 99) || '0';
    const to = pythonGenerator.valueToCode(block, 'TO', 99) || '0';
    const step = pythonGenerator.valueToCode(block, 'STEP', 99) || '1';
    const code = `range(${from}, ${to}, ${step})`;
    return [code, 3];
  };

  return pythonGenerator;
};
