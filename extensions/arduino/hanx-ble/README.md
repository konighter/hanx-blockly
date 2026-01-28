# hanx-ble (Arduino UNO R4 WiFi 内置 BLE 蓝牙)

该扩展为 Arduino UNO R4 WiFi 的内置 ESP32 模块提供 BLE（低功耗蓝牙）支持。

## 功能特性

### 1. 服务与特征定义 (Peripheral 模式)

支持构建自定义的 BLE 外设，允许其他设备（如手机）连接并交互。

- **定义 BLE 服务**: 创建逻辑功能组（使用 UUID 标识）。
- **定义 BLE 特征**:
  - 支持 **读取 (Read)**, **写入 (Write)**, **通知 (Notify)** 属性。
  - 支持多种数据类型：**整数 (Int)**, **字节 (Byte)**, **浮点数 (Float)**, **字符串 (String)**。

### 2. 数据收发交互

- **发送数据**: 写入特征值，并支持自动向订阅者发送通知。
- **接收数据**:
  - 实时监控特征是否被外部设备写入。
  - 读取外部设备写入的最新数值。

## 快速上手

1. **初始化**: 使用 `初始化 BLE 名称` 设置广播名称。
2. **构建服务**: 使用 `定义 BLE 服务` 开始。
3. **添加特征**: 在服务块之后使用 `定义 BLE 特征`。
4. **启动服务**: 使用 `开始 BLE 广播` 使设备可见。
5. **处理逻辑**: 在循环中使用 `BLE 特征被写入?` 和 `BLE 读取特征` 处理收到的指令。

## 示例：双向数据交互应用

该示例实现了：通过手机控制 LED 灯开关，同时将 A0 引脚的模拟传感器数据传回手机。

### 1. 逻辑描述

- **初始化**: 设置名称为 "HanX_Control"，创建服务 `FF01`。
- **特征 1 (接收)**: UUID `FF02`，类型为字节，用于接收开关指令。
- **特征 2 (发送)**: UUID `FF03`，类型为整数，支持通知，用于发送传感器数据。
- **主循环**:
  - 检查 `FF02` 是否被写入，若是则根据读取值设置引脚 13。
  - 若已连接，每隔 500ms 将 A0 的值写入 `FF03`。

### 2. 生成的代码预览 (C++)

```cpp
#include <ArduinoBLE.h>

BLEService bleService_FF01("FF01");
BLEByteCharacteristic bleChar_FF02("FF02", BLERead | BLEWrite);
BLEIntCharacteristic bleChar_FF03("FF03", BLERead | BLENotify);

void setup() {
  pinMode(13, OUTPUT);
  if (!BLE.begin()) { while (1); }
  BLE.setLocalName("HanX_Control");
  BLE.addService(bleService_FF01);
  bleService_FF01.addCharacteristic(bleChar_FF02);
  bleService_FF01.addCharacteristic(bleChar_FF03);
  BLE.advertise();
}

void loop() {
  if (bleChar_FF02.written()) {
    digitalWrite(13, bleChar_FF02.value());
  }
  if (BLE.central().connected()) {
    bleChar_FF03.writeValue(analogRead(A0));
    delay(500);
  }
}
```

---

> [!TIP]
> 推荐使用手机端的 **nRF Connect** 调试工具来扫描、连接并测试您定义的各种服务和数据特征。
