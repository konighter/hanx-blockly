# Arduino Mode Dependencies

This module handles Arduino compilation and uploading.

## System Requirements

- `arduino-cli`: Command line tool for Arduino.
- `arduino:avr` core: Required for compiling for Uno/Mega etc.

## Installation (macOS)

```bash
brew install arduino-cli
arduino-cli core update-index
arduino-cli core install arduino:avr
```
