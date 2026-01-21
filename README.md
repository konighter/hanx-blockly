# HanX Blockly IDE (Python & Arduino)

这是一个基于 Tauri 和 Blockly 开发的跨平台图形化编程集成开发环境（IDE），支持 Python 和 Arduino 编程模式。它具有硬件自动识别、插件扩展系统和原生性能体验。

## 🚀 主要功能

- **多模式切换**：支持 Arduino（C++）和 Python 编程模式，具备独立的工具栏和代码生成器。
- **智能硬件发现**：自动扫描并识别连接的 Arduino 开发板（如 Uno, Mega, R4 WiFi 等）及其对应的串口，无需手动配置。
- **扩展系统**：支持通过 JSON 和 JavaScript 定义第三方组件库，可以动态导入新的图形化积木块。
- **实时串口监控**：内置串口终端，方便查看开发板输出数据。
- **文件管理**：支持 XML 格式的代码工程保存与跨平台导入。
- **现代化 UI**：基于 React 和 Shadcn UI 的极简设计，支持动态反馈。

## 🛠️ 依赖与环境要求

### 基础环境

- **Rust**: [安装指导](https://www.rust-lang.org/tools/install)
- **Node.js**: (v16+)
- **pnpm**: (建议)

### 模式特定依赖

- **Arduino 模式**:
  - `arduino-cli`: `brew install arduino-cli`
  - AVR 核心: `arduino-cli core install arduino:avr`
- **Python 模式**:
  - `python3`: 确保在系统路径中可用。

## 📦 安装与启动

1. **克隆项目**:

   ```bash
   git clone <repo_url>
   cd blockly
   ```

2. **安装前端依赖**:

   ```bash
   pnpm install
   ```

3. **启动开发环境**:
   ```bash
   pnpm tauri dev
   ```

## 🧩 扩展（组件）开发方式

扩展通过一个独立的目录定义，包含以下核心文件：

- `manifest.json`: 扩展元数据，决定在 Toolbox 中显示的分类和图标。
- `blocks.json`: 使用 Google Blockly 标准 JSON 格式定义的积木块外观。
- `generator.js`: 对应积木块的代码生成逻辑（JavaScript 实现）。
- `python/` / `arduino/`: 可选，包含扩展依赖的原始代码库。

### 导入扩展

在应用中点击 **用户图标 -> 管理组件 -> 导入组件**，选择包含上述文件的目录即可。

## 🧱 积木块（Block）开发定义

### 1. 定义外观 (Blocks)

在 `frontend/src/modes/arduino/blocks.ts` 或扩展的 `blocks.json` 中定义：

```json
{
  "type": "sample_block",
  "message0": "执行动作 %1",
  "args0": [{ "type": "input_value", "name": "VALUE" }],
  "colour": 160
}
```

### 2. 定义逻辑 (Generator)

在 `generator.ts` 中实现 C++ 或 Python 转换逻辑：

```javascript
arduinoGenerator.forBlock["sample_block"] = function (block) {
  const val = arduinoGenerator.valueToCode(block, "VALUE", 0);
  return `doAction(${val});\n`;
};
```

## 📜 已实现的功能积木

### Arduino

- **基础**: 初始化 (Setup), 循环 (Loop)
- **输入输出**: 数字读写, 模拟读写(PWM), 硬件中断, 脉冲长度, 音调播放
- **串口通信**: 串口打印 (print/println), 串口数据检测, 串口读取
- **控制**: 如果...那么, 循环, 延时, 系统运行时间
- **多任务**: MsTimer2 定时器支持, SCoop 多任务库支持

### Python

- **基础逻辑**: 条件判断, 比较, 布尔运算
- **数学**: 数字运算, 随机数
- **视觉扩展**: 摄像头初始化, 捕获画面, 颜色检测（OpenCV 实现）

## 🚀 发布与持续集成 (CI/CD)

项目已配置 GitHub Actions 自动化流水线。

- **自动构建与发布**: 当你向仓库推送一个形如 `v*` 的标签（例如 `v0.1.0`）时，GitHub 会自动启动构建任务，并为 macOS, Windows 和 Linux 生成安装包，作为 Draft Release 发布。
- **触发方式**:
  ```bash
  git tag v0.1.0
  git push origin v0.1.0
  ```

## 📂 项目结构

```text
├── frontend/             # 桌面端 UI (React + Vite)
│   ├── src/components/   # 公用 UI 组件（Select, Dialog 等）
│   ├── src/modes/        # 核心编程模式逻辑
│   │   ├── arduino/      # Arduino 专属积木、生成器与工具栏
│   │   └── python/       # Python 专属逻辑
│   └── src/context/      # 全局状态管理
├── src-tauri/            # Rust 后端（Tauri）
│   ├── src/cmd/          # 后端指令集 (arduino, python, serial, sys)
│   └── main.rs           # 应用入口与指令注册
└── extensions/           # 示例扩展库
```
