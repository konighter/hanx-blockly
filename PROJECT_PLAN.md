# Blockly IDE Development Plan

## Phase 1: Environment Setup

- [ ] Initialize Tauri project with Vite + React.
- [ ] Configure `tauri.conf.json` for security and capabilities.
- [ ] Setup Rust serialport dependencies.

## Phase 2: Blockly Foundation

- [ ] Integrate `@blockly/continuous-toolbox`.
- [ ] Create custom design system (CSS variables matching Blockly theme).
- [ ] Implement workspace persistence (Auto-save to local file).

## Phase 3: Language Support

- [ ] **Python**:
  - Implement Python generator for custom blocks.
  - Rust command to spawn python process and pipe stdout/stderr.
- [ ] **Arduino**:
  - Implement Arduino C++ generator.
  - Rust commands for `arduino-cli` integration (board detection, compile, upload).

## Phase 4: UI/UX Refinement

- [ ] Integrated Monaco editor for "Code View".
- [ ] Theme switcher (Light/Dark).
- [ ] Serial monitor component.

## Phase 5: Distribution

- [ ] Configure GitHub Actions for builds.
- [ ] Generate installers (.msi, .dmg, .deb).
