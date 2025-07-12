# Browser Automation Script Generator Extension

A Chrome browser extension that records user actions, allows selection/customization, and generates automation scripts for Playwright, Cypress, Selenium, or plain JS. Supports advanced natural language assertions, custom validation, and reporting logic.

## Features
- **Record user actions** (clicks, inputs) on any web page
- **Popup UI** for starting/stopping recording, uploading config, selecting actions, editing selectors, and adding assertions
- **Framework support**: Playwright, Cypress, Selenium, plain JS
- **Custom validation**: Enter natural language assertions (supports AND, OR, not contains, starts/ends with, nth-child, if/then, waits, reporting, error handling, etc.)
- **Script generation**: Generates code based on selected actions and user instructions
- **Download scripts** for use in your test repo

## How to Use
1. **Load the extension** in Chrome (go to chrome://extensions, enable Developer Mode, Load Unpacked, select this folder)
2. **Click the extension icon** to open the popup
3. **Start recording** actions, interact with the page, then stop recording
4. **Select actions** to include, edit selectors/assertions, upload a config (optional)
5. **Generate script** and download the file

## File Structure
- `manifest.json`: Extension manifest (MV3)
- `background.js`: Handles messaging and storage
- `content.js`: Injected script for recording actions
- `popup/`: UI files (HTML/CSS/JS)
- `configParser.js`: Parses framework config for script templates
- `scriptGenerator.js`: Generates scripts with advanced assertion parsing

## Advanced Assertion Instructions
- Supports AND/OR logic, count/length, regex, not contains, starts/ends with, nth-child
- Conditional logic: `if ... then ...`, wait/retry, reporting, error handling
- See code comments for examples

## Requirements
- Chrome (MV3 support)
- No external dependencies for basic use
- For script execution: Playwright, Cypress, or Selenium installed in your test repo

---

For questions or feature requests, open an issue or contact the developer.
