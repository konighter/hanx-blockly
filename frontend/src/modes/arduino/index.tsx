import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { IModeConfig } from '../types';
import { initArduinoGenerator } from './generator';
import { defineArduinoBlocks } from './blocks';
import { ArduinoToolbar } from './ArduinoToolbar';
import { ArduinoBottomPanel } from './ArduinoBottomPanel';

// Define initial blocks
defineArduinoBlocks();

export const config: IModeConfig = {
  id: 'arduino',
  name: 'arduino',
  label: 'Arduino Uno',
  toolbox: {
    kind: 'categoryToolbox',
    contents: [
      { kind: 'category', name: '基础', colour: '360', contents: [{ kind: 'block', type: 'arduino_setup' }] },
      { kind: 'category', name: '输入/输出', colour: '160', contents: [
        { kind: 'block', type: 'arduino_digital_write', inputs: { PIN: { shadow: { type: 'math_number', fields: { NUM: 13 } } }, STATE: { shadow: { type: 'arduino_highlow', fields: { STATE: 'HIGH' } } } } },
        { kind: 'block', type: 'arduino_digital_read', inputs: { PIN: { shadow: { type: 'math_number', fields: { NUM: 13 } } } } },
        { kind: 'block', type: 'arduino_analog_write', inputs: { PIN: { shadow: { type: 'math_number', fields: { NUM: 3 } } }, VALUE: { shadow: { type: 'math_number', fields: { NUM: 128 } } } } },
        { kind: 'block', type: 'arduino_analog_read', inputs: { PIN: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } },
        { kind: 'block', type: 'arduino_highlow' },
        { kind: 'sep' },
        { kind: 'block', type: 'arduino_tone', inputs: { PIN: { shadow: { type: 'math_number', fields: { NUM: 9 } } }, FREQ: { shadow: { type: 'math_number', fields: { NUM: 440 } } }, DURATION: { shadow: { type: 'math_number', fields: { NUM: 1000 } } } } },
        { kind: 'block', type: 'arduino_notone', inputs: { PIN: { shadow: { type: 'math_number', fields: { NUM: 9 } } } } },
        { kind: 'block', type: 'arduino_pulse_in', inputs: { PIN: { shadow: { type: 'math_number', fields: { NUM: 7 } } }, STATE: { shadow: { type: 'arduino_highlow', fields: { STATE: 'HIGH' } } } } },
        { kind: 'block', type: 'arduino_pulse_in_timeout', inputs: { PIN: { shadow: { type: 'math_number', fields: { NUM: 7 } } }, STATE: { shadow: { type: 'arduino_highlow', fields: { STATE: 'HIGH' } } }, TIMEOUT: { shadow: { type: 'math_number', fields: { NUM: 1000000 } } } } },
        { kind: 'sep' },
        { kind: 'block', type: 'arduino_interrupt', inputs: { PIN: { shadow: { type: 'math_number', fields: { NUM: 2 } } } } },
        { kind: 'block', type: 'arduino_detach_interrupt', inputs: { PIN: { shadow: { type: 'math_number', fields: { NUM: 2 } } } } },
        { kind: 'sep' },
        { kind: 'block', type: 'arduino_shiftout', inputs: { DATA: { shadow: { type: 'math_number', fields: { NUM: 11 } } }, CLOCK: { shadow: { type: 'math_number', fields: { NUM: 12 } } }, VALUE: { shadow: { type: 'math_number', fields: { NUM: 255 } } } } },
        { kind: 'block', type: 'arduino_pin_mode', inputs: { PIN: { shadow: { type: 'math_number', fields: { NUM: 13 } } } } }
      ]},
      { kind: 'category', name: '串口通信', colour: '160', contents: [
        { kind: 'block', type: 'arduino_serial_print' },
        { kind: 'block', type: 'arduino_serial_println' },
        { kind: 'block', type: 'arduino_serial_available' },
        { kind: 'block', type: 'arduino_serial_read' }
      ]},
      { kind: 'category', name: '文本', colour: '160', contents: [
        { kind: 'block', type: 'text', gap: 8 },
        { kind: 'block', type: 'text_join', gap: 8 },
        { kind: 'block', type: 'text_append', gap: 8 },
        { kind: 'block', type: 'text_length', gap: 8 },
        { kind: 'block', type: 'text_isEmpty', gap: 8 },
        { kind: 'block', type: 'text_indexOf', gap: 8 },
        { kind: 'block', type: 'text_charAt', gap: 8 },
        { kind: 'block', type: 'text_getSubstring', gap: 8 },
        { kind: 'block', type: 'text_changeCase', gap: 8 },
        { kind: 'block', type: 'text_trim', gap: 24 },
        { kind: 'sep', gap: 24 },
        { kind: 'block', type: 'arduino_text_toInt', gap: 8 },
        { kind: 'block', type: 'arduino_text_toFloat', gap: 8 }
      ]},
      { kind: 'category', name: '控制', colour: '120', contents: [
        { kind: 'block', type: 'controls_if', gap: 16 }, 
        { kind: 'block', type: 'controls_repeat_ext', gap: 16 },
        { kind: 'block', type: 'controls_whileUntil', gap: 16 },
        { kind: 'block', type: 'controls_for', gap: 16 },
        { kind: 'block', type: 'controls_flow_statements', gap: 16 },
        { kind: 'sep', gap: 32 },
        { kind: 'block', type: 'arduino_delay', gap: 16, inputs: { VALUE: { shadow: { type: 'math_number', fields: { NUM: 1000 } } } } },
        { kind: 'block', type: 'arduino_system_time', gap: 16 },
        { kind: 'sep', gap: 32 },
        { kind: 'block', type: 'arduino_interrupt_control', gap: 16 },
        /* 
        { kind: 'sep', gap: 32 },
        { kind: 'block', type: 'arduino_mstimer2_setup', gap: 16, inputs: { TIME: { shadow: { type: 'math_number', fields: { NUM: 500 } } } } },
        { kind: 'block', type: 'arduino_mstimer2_control', gap: 16 },
        { kind: 'sep', gap: 32 },
        { kind: 'block', type: 'arduino_scoop_task', gap: 16 },
        { kind: 'block', type: 'arduino_scoop_yield', gap: 16 },
        { kind: 'block', type: 'arduino_scoop_sleep', gap: 16, inputs: { TIME: { shadow: { type: 'math_number', fields: { NUM: 1000 } } } } }
        */
      ]},
      { kind: 'category', name: '数学', colour: '230', contents: [
        { kind: 'block', type: 'math_number', gap: 12 }, 
        { kind: 'block', type: 'math_arithmetic', gap: 12 }
      ] },
      { kind: 'category', name: '逻辑', colour: '210', contents: [
        { kind: 'block', type: 'logic_compare', gap: 12 }, 
        { kind: 'block', type: 'logic_operation', gap: 12 }, 
        { kind: 'block', type: 'logic_negate', gap: 12 }, 
        { kind: 'block', type: 'logic_boolean', gap: 12 }
      ] },
      { kind: 'category', name: '变量', colour: '330', custom: 'VARIABLE', contents: [
        { kind: 'block', type: 'variables_set', inputs: { VALUE: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } },
        { kind: 'block', type: 'variables_get' }
      ]},
      /*
      { kind: 'category', name: '函数定义', colour: '290', contents: [
        { kind: 'block', type: 'arduino_functions_defnoreturn', gap: 12 },
        { kind: 'block', type: 'arduino_functions_defreturn', gap: 12 }
      ]},
      */
      { kind: 'category', name: '使用函数', colour: '290', custom: 'PROCEDURE' },
      
    ],
  },
  initGenerator: () => {
    defineArduinoBlocks();
    return initArduinoGenerator();
  },
  onRun: async (code, libs, context) => {
    const { selectedPort, selectedBoard } = context;
    if (!selectedPort) throw new Error("Please select a serial port");
    await invoke('upload_arduino', { 
      code, 
      port: selectedPort, 
      fqbn: selectedBoard || 'arduino:avr:uno',
      libs 
    });
  },
  onCompile: async (code, libs, context) => {
    const { selectedBoard } = context;
    await invoke('compile_arduino', { 
      code, 
      fqbn: selectedBoard || 'arduino:avr:uno',
      libs 
    });
  },
  onStop: async () => {
    await invoke('stop_execution');
  },
  onInitialize: (context) => {
    const { setOutput, setSerialLog } = context;
    const u1 = listen('arduino-output', (event: any) => setOutput((prev: string) => prev + event.payload + '\n'));
    const u2 = listen('arduino-stderr', (event: any) => setOutput((prev: string) => prev + 'Compile/Upload Error: ' + event.payload + '\n'));
    const u3 = listen('arduino-finished', (event: any) => setOutput((prev: string) => prev + '\n>>> ' + event.payload + '\n'));
    const u4 = listen('serial-data', (event: any) => {
      setSerialLog((prev: string) => {
        const newLog = prev + event.payload;
        return newLog.length > 5000 ? newLog.slice(-5000) : newLog;
      });
    });
    
    return () => {
      u1.then((f: any) => f());
      u2.then((f: any) => f());
      u3.then((f: any) => f());
      u4.then((f: any) => f());
    };
  },
  ToolbarExtra: ArduinoToolbar,
  BottomPanel: ArduinoBottomPanel
};
