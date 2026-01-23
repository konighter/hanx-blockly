import * as Blockly from 'blockly';

let blocksRegistered = false;

export const defineArduinoBlocks = () => {
  if (blocksRegistered) {
    console.log('[ArduinoBlocks] Already registered.');
    return;
  }
  blocksRegistered = true;
  console.log('[ArduinoBlocks] Registering blocks...');

  // Helper Blocks for the Mutator (Register these FIRST)
  // @ts-ignore
  Blockly.Blocks['arduino_functions_param_container'] = {
    init: function() {
      this.appendDummyInput().appendField("参数列表");
      this.appendStatementInput("STACK");
      this.setColour(290);
      this.contextMenu = false;
    }
  };

  // @ts-ignore
  Blockly.Blocks['arduino_functions_param_item'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("参数")
          .appendField(new Blockly.FieldTextInput("x"), "NAME")
          .appendField("类型")
          .appendField(new Blockly.FieldDropdown([
            ["int", "int"],
            ["float", "float"],
            ["long", "long"],
            ["boolean", "boolean"],
            ["String", "String"],
            ["char", "char"],
            ["byte", "byte"]
          ]), "TYPE");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(290);
      this.contextMenu = false;
    }
  };

  // --- COMMON HELPERS FOR TYPED FUNCTIONS ---

  const commonMutationToDom = function(this: any) {
    if (!this.arguments_) this.arguments_ = [];
    const container = Blockly.utils.xml.createElement('mutation');
    for (let i = 0; i < this.arguments_.length; i++) {
        const parameter = Blockly.utils.xml.createElement('arg');
        parameter.setAttribute('name', this.arguments_[i].name);
        parameter.setAttribute('type', this.arguments_[i].type);
        container.appendChild(parameter);
    }
    return container;
  };

  const commonDomToMutation = function(this: any, xmlElement: Element) {
    this.arguments_ = [];
    if (xmlElement && xmlElement.childNodes) {
      for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
          const node = childNode as Element;
          if (node.nodeName && node.nodeName.toLowerCase() === 'arg') {
              this.arguments_.push({
                  name: node.getAttribute('name') || '',
                  type: node.getAttribute('type') || 'int'
              });
          }
      }
    }
    this.updateShape_();
  };

  const commonDecompose = function(this: any, workspace: Blockly.Workspace) {
    if (!this.arguments_) this.arguments_ = [];
    const containerBlock = workspace.newBlock('arduino_functions_param_container');
    if ((containerBlock as any).initSvg) (containerBlock as any).initSvg();
    let connection = containerBlock.getInput('STACK')!.connection;
    for (let i = 0; i < this.arguments_.length; i++) {
        const paramBlock = workspace.newBlock('arduino_functions_param_item');
        if ((paramBlock as any).initSvg) (paramBlock as any).initSvg();
        paramBlock.setFieldValue(this.arguments_[i].name, 'NAME');
        paramBlock.setFieldValue(this.arguments_[i].type, 'TYPE');
        if (connection) {
          connection.connect(paramBlock.previousConnection!);
          connection = paramBlock.nextConnection;
        }
    }
    return containerBlock;
  };

  const commonCompose = function(this: any, containerBlock: Blockly.Block) {
    this.arguments_ = [];
    let paramBlock = containerBlock.getInputTargetBlock('STACK');
    while (paramBlock) {
        this.arguments_.push({
            name: paramBlock.getFieldValue('NAME'),
            type: paramBlock.getFieldValue('TYPE')
        });
        paramBlock = paramBlock.nextConnection && paramBlock.nextConnection.targetBlock();
    }
    this.updateShape_();
  };

  const commonUpdateShape = function(this: any) {
    if (!this.arguments_) this.arguments_ = [];
    // Remove old arg inputs
    let i = 0;
    while (this.getInput('ARG' + i)) {
        this.removeInput('ARG' + i);
        i++;
    }
    // Add current arg inputs
    for (let i = 0; i < this.arguments_.length; i++) {
        const arg = this.arguments_[i];
        this.appendDummyInput('ARG' + i)
            .appendField(arg.type + " " + arg.name);
    }
  };

  // --- TYPED FUNCTION DEFINITIONS ---

  // Handle the "No Return" Typed Function
  // @ts-ignore
  Blockly.Blocks['arduino_functions_defnoreturn'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("定义函数 (void)")
          .appendField(new Blockly.FieldTextInput("myFunction"), "NAME");
      this.appendStatementInput("STACK")
          .appendField("执行");
      // @ts-ignore
      this.setMutator(new Blockly.Mutator(['arduino_functions_param_item']));
      this.setColour(290);
      this.setTooltip("定义一个不返回值的函数，带类型参数。");
      this.arguments_ = [];
    },
    mutationToDom: commonMutationToDom,
    domToMutation: commonDomToMutation,
    decompose: commonDecompose,
    compose: commonCompose,
    updateShape_: commonUpdateShape
  };

  // Handle the "Return" Typed Function
  // @ts-ignore
  Blockly.Blocks['arduino_functions_defreturn'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("定义函数 (返回")
          .appendField(new Blockly.FieldDropdown([
            ["int", "int"],
            ["float", "float"],
            ["long", "long"],
            ["boolean", "boolean"],
            ["String", "String"],
            ["char", "char"],
            ["byte", "byte"]
          ]), "RETURN_TYPE")
          .appendField(")")
          .appendField(new Blockly.FieldTextInput("myFunction"), "NAME");
      this.appendStatementInput("STACK")
          .appendField("执行");
      this.appendValueInput("RETURN")
          .setCheck(null)
          .appendField("返回");
      // @ts-ignore
      this.setMutator(new Blockly.Mutator(['arduino_functions_param_item']));
      this.setColour(290);
      this.setTooltip("定义一个带返回值的函数，带类型参数。");
      this.arguments_ = [];
    },
    mutationToDom: commonMutationToDom,
    domToMutation: commonDomToMutation,
    decompose: commonDecompose,
    compose: commonCompose,
    updateShape_: commonUpdateShape
  };

  // 1. Standard Arduino Blocks (JSON definition)
  Blockly.defineBlocksWithJsonArray([
    // Setup/Loop
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
    // Digital Write
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
    // Digital Read
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
    // Analog Write
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
    // Analog Read
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
    // High/Low Constant
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
    // Hardware Interrupt
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
    // Detach Interrupt
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
    // Pulse In
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
    // Pulse In with Timeout
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
    // Tone
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
    // NoTone
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
    // ShiftOut
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
    // PinMode
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
    // Delay
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
    // System Time
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
    // Interrupt Control
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
    // Serial Print
    {
       "type": "arduino_serial_print",
       "message0": "串口打印 %1",
       "args0": [
         { "type": "input_value", "name": "CONTENT" }
       ],
       "previousStatement": null,
       "nextStatement": null,
       "colour": "160"
    },
    // Serial Println
    {
       "type": "arduino_serial_println",
       "message0": "串口打印 (换行) %1",
       "args0": [
         { "type": "input_value", "name": "CONTENT" }
       ],
       "previousStatement": null,
       "nextStatement": null,
       "colour": "160"
    },
    // Serial Available
    {
      "type": "arduino_serial_available",
      "message0": "串口有数据可读?",
      "output": "Boolean",
      "colour": "160"
    },
    // Serial Read
    {
      "type": "arduino_serial_read",
      "message0": "串口读取字节",
      "output": "Number",
      "colour": "160"
    },
    // Text to Int
    {
      "type": "arduino_text_toInt",
      "message0": "文本 %1 转为整数",
      "args0": [{ "type": "input_value", "name": "TEXT" }],
      "output": "Number",
      "colour": "160"
    },
    // Text to Float
    {
      "type": "arduino_text_toFloat",
      "message0": "文本 %1 转为浮点数",
      "args0": [{ "type": "input_value", "name": "TEXT" }],
      "output": "Number",
      "colour": "160"
    }
  ]);
};
