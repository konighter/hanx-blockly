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
        { kind: 'block', type: 'arduino_serial_read' },
        { kind: 'block', type: 'text' }
      ]},
      { kind: 'category', name: '控制', colour: '120', contents: [
        { kind: 'block', type: 'controls_if' }, 
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_whileUntil' },
        { kind: 'block', type: 'controls_for' },
        { kind: 'block', type: 'controls_flow_statements' },
        { kind: 'sep' },
        { kind: 'block', type: 'arduino_delay', inputs: { VALUE: { shadow: { type: 'math_number', fields: { NUM: 1000 } } } } },
        { kind: 'block', type: 'arduino_system_time' },
        { kind: 'sep' },
        { kind: 'block', type: 'arduino_interrupt_control' },
        { kind: 'sep' },
        { kind: 'block', type: 'arduino_mstimer2_setup', inputs: { TIME: { shadow: { type: 'math_number', fields: { NUM: 500 } } } } },
        { kind: 'block', type: 'arduino_mstimer2_control' },
        { kind: 'sep' },
        { kind: 'block', type: 'arduino_scoop_task' },
        { kind: 'block', type: 'arduino_scoop_yield' },
        { kind: 'block', type: 'arduino_scoop_sleep', inputs: { TIME: { shadow: { type: 'math_number', fields: { NUM: 1000 } } } } }
      ]},
      { kind: 'category', name: '数学', colour: '230', contents: [{ kind: 'block', type: 'math_number' }, { kind: 'block', type: 'math_arithmetic' }] },
      { kind: 'category', name: '逻辑', colour: '210', contents: [{ kind: 'block', type: 'logic_compare' }, { kind: 'block', type: 'logic_operation' }, { kind: 'block', type: 'logic_negate' }, { kind: 'block', type: 'logic_boolean' }] },
      { kind: 'category', name: '变量', colour: '330', custom: 'VARIABLE' },
      { kind: 'category', name: '函数', colour: '290', custom: 'PROCEDURE' },
    ],
  },
  initGenerator: () => {
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
