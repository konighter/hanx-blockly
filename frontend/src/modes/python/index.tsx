import * as Blockly from 'blockly';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { IModeConfig } from '../types';
import { initPythonGenerator } from './generator';
import { PythonToolbar } from './PythonToolbar';

export const config: IModeConfig = {
  id: 'python',
  name: 'python',
  label: 'Python 3',
  toolbox: {
    kind: 'categoryToolbox',
    contents: [
      { kind: 'category', name: '输入/输出', colour: '160', contents: [{ kind: 'block', type: 'text_print' }, { kind: 'block', type: 'python_input' }] },
      { kind: 'category', name: '控制', colour: '120', contents: [
        { kind: 'block', type: 'controls_if' }, 
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for' },
        { kind: 'block', type: 'controls_forEach' },
        { kind: 'block', type: 'controls_flow_statements' }
      ]},
      { kind: 'category', name: '数学', colour: '230', contents: [{ kind: 'block', type: 'math_number' }, { kind: 'block', type: 'math_arithmetic' }, { kind: 'block', type: 'math_random_int' }] },
      { kind: 'category', name: '逻辑', colour: '210', contents: [{ kind: 'block', type: 'logic_compare' }, { kind: 'block', type: 'logic_operation' }, { kind: 'block', type: 'logic_negate' }, { kind: 'block', type: 'logic_boolean' }] },
      { kind: 'category', name: '文本', colour: '160', contents: [{ kind: 'block', type: 'text' }, { kind: 'block', type: 'text_join' }, { kind: 'block', type: 'text_length' }] },
      { kind: 'category', name: '列表', colour: '260', contents: [{ kind: 'block', type: 'lists_create_with' }, { kind: 'block', type: 'lists_getIndex' }, { kind: 'block', type: 'lists_setIndex' }] },
      { kind: 'category', name: '元组', colour: '260', contents: [{ kind: 'block', type: 'python_tuple' }] },
      { kind: 'category', name: '字典', colour: '345', contents: [{ kind: 'block', type: 'dicts_create_with' }, { kind: 'block', type: 'dict_get' }] },
      { kind: 'sep' },
      { kind: 'category', name: '变量', colour: '330', custom: 'VARIABLE' },
      { kind: 'category', name: '函数', colour: '290', custom: 'PROCEDURE' },
    ],
  },
  initGenerator: () => {
    // Define Custom Blocks for Python
    if (!Blockly.Blocks['python_tuple']) {
      Blockly.Blocks['python_tuple'] = {
        init: function() {
          this.appendValueInput("ITEMS")
              .setCheck("Array")
              .appendField("create tuple from list");
          this.setOutput(true, "Tuple");
          this.setColour(260);
          this.setTooltip("Create a Python tuple from a list.");
        }
      };
    }
  
    if (!Blockly.Blocks['dicts_create_with']) {
      Blockly.Blocks['dicts_create_with'] = {
        init: function() {
          this.appendDummyInput().appendField("create empty dictionary");
          this.setOutput(true, "Dict");
          this.setColour(345);
        }
      };
    }
  
    if (!Blockly.Blocks['dict_get']) {
      Blockly.Blocks['dict_get'] = {
        init: function() {
          this.appendValueInput("DICT").setCheck("Dict").appendField("in dict");
          this.appendValueInput("KEY").appendField("get key");
          this.setOutput(true, null);
          this.setInputsInline(true);
          this.setColour(345);
        }
      };
    }
  
    return initPythonGenerator();
  },
  onRun: async (code, libs, _context) => {
    await invoke('run_python_code', { code, libs });
  },
  onStop: async () => {
    await invoke('stop_execution');
  },
  onInitialize: (context) => {
    const { setOutput } = context;
    const u1 = listen('python-output', (event: any) => setOutput((prev: string) => prev + event.payload + '\n'));
    const u2 = listen('python-stderr', (event: any) => setOutput((prev: string) => prev + 'Error: ' + event.payload + '\n'));
    const u3 = listen('python-finished', (event: any) => setOutput((prev: string) => prev + '\n>>> ' + event.payload + '\n'));
    
    return () => {
      u1.then((f: any) => f());
      u2.then((f: any) => f());
      u3.then((f: any) => f());
    };
  },
  ToolbarExtra: PythonToolbar
};
