import * as Blockly from 'blockly';

export const defineArduinoBlocks = () => {
  // 1. Setup/Loop Block (Replaces the basic one)
  Blockly.defineBlocksWithJsonArray([
    {
      "type": "arduino_setup",
      "message0": "初始化 (Setup) %1 执行 (Loop) %2",
      "args0": [
        { "type": "input_statement", "name": "SETUP" },
        { "type": "input_statement", "name": "LOOP" }
      ],
      "colour": "360",
      "tooltip": "setup() 代码运行一次，loop() 代码重复运行。",
      "helpUrl": "https://www.arduino.cc/en/Reference/HomePage"
    },
    // 2. Digital Write
    {
      "type": "arduino_digital_write",
      "message0": "数字输出 管脚# %1 设为 %2",
      "args0": [
        { "type": "input_value", "name": "PIN", "check": "Number" },
        { "type": "input_value", "name": "STATE" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "160",
      "tooltip": "将数字信号（HIGH或LOW）写入特定的数字。"
    },
    // 3. Digital Read
    {
      "type": "arduino_digital_read",
      "message0": "数字输入 管脚# %1",
      "args0": [
        { "type": "input_value", "name": "PIN", "check": "Number" }
      ],
      "output": "Number",
      "colour": "160",
      "tooltip": "从指定的数字管脚读取数字值。"
    },
    // 4. Analog Write (PWM)
    {
      "type": "arduino_analog_write",
      "message0": "模拟输出 管脚# %1 赋值为 %2",
      "args0": [
        { "type": "input_value", "name": "PIN", "check": "Number" },
        { "type": "input_value", "name": "VALUE", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "160",
      "tooltip": "将模拟值(PWM波)写入管脚。"
    },
    // 5. Analog Read
    {
      "type": "arduino_analog_read",
      "message0": "模拟输入 管脚# %1",
      "args0": [
        { "type": "input_value", "name": "PIN" }
      ],
      "output": "Number",
      "colour": "160",
      "tooltip": "从指定的模拟管脚读取数值。"
    },
    // 6. High/Low Constant
    {
      "type": "arduino_highlow",
      "message0": "%1",
      "args0": [
        {
          "type": "field_dropdown",
          "name": "STATE",
          "options": [
            ["高 (HIGH)", "HIGH"],
            ["低 (LOW)", "LOW"]
          ]
        }
      ],
      "output": "Number",
      "colour": "160"
    },
    // 7. Hardware Interrupt
    {
      "type": "arduino_interrupt",
      "message0": "硬件中断 管脚# %1 模式 %2 执行 %3",
      "args0": [
        { "type": "input_value", "name": "PIN", "check": "Number" },
        { 
          "type": "field_dropdown", 
          "name": "MODE", 
          "options": [
            ["上升 (RISING)", "RISING"],
            ["下降 (FALLING)", "FALLING"],
            ["改变 (CHANGE)", "CHANGE"],
            ["低 (LOW)", "LOW"]
          ] 
        },
        { "type": "input_statement", "name": "DO" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "160"
    },
    // 8. Detach Interrupt
    {
      "type": "arduino_detach_interrupt",
      "message0": "取消硬件中断 管脚# %1",
      "args0": [
        { "type": "input_value", "name": "PIN", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "160"
    },
    // 9. Pulse In
    {
      "type": "arduino_pulse_in",
      "message0": "脉冲长度 (微秒) 管脚# %1 状态 %2",
      "args0": [
        { "type": "input_value", "name": "PIN", "check": "Number" },
        { "type": "input_value", "name": "STATE" }
      ],
      "output": "Number",
      "colour": "160"
    },
    // 10. Pulse In with Timeout
    {
      "type": "arduino_pulse_in_timeout",
      "message0": "脉冲长度 (微秒) 管脚# %1 状态 %2 超时 (微秒) %3",
      "args0": [
        { "type": "input_value", "name": "PIN", "check": "Number" },
        { "type": "input_value", "name": "STATE" },
        { "type": "input_value", "name": "TIMEOUT", "check": "Number" }
      ],
      "output": "Number",
      "colour": "160"
    },
    // 11. Tone
    {
      "type": "arduino_tone",
      "message0": "播放音调 管脚# %1 频率 %2 持续时间 %3",
      "args0": [
        { "type": "input_value", "name": "PIN", "check": "Number" },
        { "type": "input_value", "name": "FREQ", "check": "Number" },
        { "type": "input_value", "name": "DURATION", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "160"
    },
    // 12. NoTone
    {
      "type": "arduino_notone",
      "message0": "停止播放音调 管脚# %1",
      "args0": [
        { "type": "input_value", "name": "PIN", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "160"
    },
    // 13. ShiftOut
    {
      "type": "arduino_shiftout",
      "message0": "ShiftOut 数据管脚# %1 时钟管脚# %2 顺序 %3 数值 %4",
      "args0": [
        { "type": "input_value", "name": "DATA", "check": "Number" },
        { "type": "input_value", "name": "CLOCK", "check": "Number" },
        { 
          "type": "field_dropdown", 
          "name": "ORDER", 
          "options": [
            ["高位先入 (MSBFIRST)", "MSBFIRST"],
            ["低位先入 (LSBFIRST)", "LSBFIRST"]
          ] 
        },
        { "type": "input_value", "name": "VALUE", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "160"
    },
    // 14. PinMode
    {
      "type": "arduino_pin_mode",
      "message0": "管脚模式 %1 设为 %2",
      "args0": [
        { "type": "input_value", "name": "PIN", "check": "Number" },
        { 
          "type": "field_dropdown", 
          "name": "MODE", 
          "options": [
            ["输入 (INPUT)", "INPUT"],
            ["输出 (OUTPUT)", "OUTPUT"],
            ["输入上拉 (INPUT_PULLUP)", "INPUT_PULLUP"]
          ] 
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "160"
    },
    // 15. Delay
    {
      "type": "arduino_delay",
      "message0": "延时 %1 %2",
      "args0": [
        { 
          "type": "field_dropdown", 
          "name": "UNIT", 
          "options": [
            ["毫秒 (ms)", "ms"],
            ["微秒 (us)", "us"]
          ] 
        },
        { "type": "input_value", "name": "VALUE", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "120"
    },
    // 16. Millis/Micros
    {
      "type": "arduino_system_time",
      "message0": "系统运行时间 %1",
      "args0": [
        { 
          "type": "field_dropdown", 
          "name": "UNIT", 
          "options": [
            ["毫秒 (ms)", "ms"],
            ["微秒 (us)", "us"]
          ] 
        }
      ],
      "output": "Number",
      "colour": "120"
    },
    // 17. Global Interrupts
    {
      "type": "arduino_interrupt_control",
      "message0": "%1中断",
      "args0": [
        { 
          "type": "field_dropdown", 
          "name": "ACTION", 
          "options": [
            ["允许", "interrupts"],
            ["禁止", "noInterrupts"]
          ] 
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "120"
    },
    // 18. MsTimer2 Setup
    {
      "type": "arduino_mstimer2_setup",
      "message0": "MsTimer2 每隔 %1 ms 执行 %2",
      "args0": [
        { "type": "input_value", "name": "TIME", "check": "Number" },
        { "type": "input_statement", "name": "DO" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "120"
    },
    // 19. MsTimer2 Start/Stop
    {
      "type": "arduino_mstimer2_control",
      "message0": "MsTimer2 %1",
      "args0": [
        { 
          "type": "field_dropdown", 
          "name": "ACTION", 
          "options": [
            ["启动", "start"],
            ["停止", "stop"]
          ] 
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "120"
    },
    // 20. SCoop Task
    {
      "type": "arduino_scoop_task",
      "message0": "SCoop 任务 %1 %2 初始化 %3 %4 循环 %5 %6",
      "args0": [
        { "type": "field_input", "name": "NAME", "text": "Task1" },
        { "type": "input_dummy" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "SETUP" },
        { "type": "input_dummy" },
        { "type": "input_statement", "name": "LOOP" }
      ],
      "colour": "120"
    },
    // 21. SCoop Yield
    {
      "type": "arduino_scoop_yield",
      "message0": "执行 SCoop 任务 (Yield)",
      "previousStatement": null,
      "nextStatement": null,
      "colour": "120"
    },
    // 22. SCoop Sleep
    {
      "type": "arduino_scoop_sleep",
      "message0": "SCoop 延时 %1 毫秒 (Sleep)",
      "args0": [
        { "type": "input_value", "name": "TIME", "check": "Number" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "120"
    },
    // 23. Serial Print
    {
      "type": "arduino_serial_print",
      "message0": "串口打印 %1",
      "args0": [
        { "type": "input_value", "name": "CONTENT" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "160",
      "tooltip": "通过串口打印数据。"
    },
    // 24. Serial Println
    {
      "type": "arduino_serial_println",
      "message0": "串口打印 (换行) %1",
      "args0": [
        { "type": "input_value", "name": "CONTENT" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "160",
      "tooltip": "通过串口打印数据并换行。"
    },
    // 25. Serial Available
    {
      "type": "arduino_serial_available",
      "message0": "串口有数据可读?",
      "output": "Boolean",
      "colour": "160",
      "tooltip": "检查串口缓冲区是否有数据。"
    },
    // 26. Serial Read
    {
      "type": "arduino_serial_read",
      "message0": "串口读取字节",
      "output": "Number",
      "colour": "160",
      "tooltip": "从串口读取一个字节的数据。"
    }
  ]);
};
