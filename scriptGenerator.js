// scriptGenerator.js
// Generates script code from actions and config
import { parseConfig, getLocator, getActionTemplate, getAssertionTemplate } from './configParser.js';


function parseCustomAssertion(instruction, framework, selector, locator) {
  if (!instruction) return null;
  const text = instruction.trim().toLowerCase();

  // Compound (simple AND)
  if (text.includes(' and ')) {
    const parts = text.split(/\s+and\s+/);
    return parts.map(part => parseCustomAssertion(part, framework, selector, locator)).filter(Boolean).join('\n  ');
  }

  // Compound (simple OR)
  if (text.includes(' or ')) {
    const parts = text.split(/\s+or\s+/);
    const codeLines = parts.map(part => parseCustomAssertion(part, framework, selector, locator)).filter(Boolean);
    if (codeLines.length > 1) {
      // For code, output as comment block for manual handling
      return [
        '// At least one of the following should pass:',
        ...codeLines.map(l => '//   ' + l)
      ].join('\n  ');
    }
  }

  // Not contains (text, value, attr)
  let m = text.match(/(text|value|attribute ([\w-]+)) does not contain ['"]?(.+?)['"]?$/);
  if (m) {
    const target = m[1], attr = m[2], val = m[3];
    if (target.startsWith('attribute')) {
      if (framework === 'playwright') return `expect((await ${locator}.getAttribute("${attr}"))).not.toContain("${val}");`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('attr', '${attr}').should('not.contain', "${val}");`;
      if (framework === 'selenium') return `assert(!driver.findElement(By.cssSelector('${selector}')).getAttribute('${attr}').includes("${val}"));`;
    } else if (target === 'text') {
      if (framework === 'playwright') return `expect(await ${locator}.textContent()).not.toContain("${val}");`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('text').should('not.contain', "${val}");`;
      if (framework === 'selenium') return `assert(!driver.findElement(By.cssSelector('${selector}')).getText().includes("${val}"));`;
    } else if (target === 'value') {
      if (framework === 'playwright') return `expect(await ${locator}.inputValue()).not.toContain("${val}");`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('val').should('not.contain', "${val}");`;
      if (framework === 'selenium') return `assert(!driver.findElement(By.cssSelector('${selector}')).getAttribute('value').includes("${val}"));`;
    }
  }

  // Starts with (text, value, attr)
  m = text.match(/(text|value|attribute ([\w-]+)) starts with ['"]?(.+?)['"]?$/);
  if (m) {
    const target = m[1], attr = m[2], val = m[3];
    if (target.startsWith('attribute')) {
      if (framework === 'playwright') return `expect((await ${locator}.getAttribute("${attr}"))).toMatch(/^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('attr', '${attr}').should('match', /^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getAttribute('${attr}').startsWith("${val}"));`;
    } else if (target === 'text') {
      if (framework === 'playwright') return `expect(await ${locator}.textContent()).toMatch(/^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('text').should('match', /^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getText().startsWith("${val}"));`;
    } else if (target === 'value') {
      if (framework === 'playwright') return `expect(await ${locator}.inputValue()).toMatch(/^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('val').should('match', /^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getAttribute('value').startsWith("${val}"));`;
    }
  }

  // Ends with (text, value, attr)
  m = text.match(/(text|value|attribute ([\w-]+)) ends with ['"]?(.+?)['"]?$/);
  if (m) {
    const target = m[1], attr = m[2], val = m[3];
    if (target.startsWith('attribute')) {
      if (framework === 'playwright') return `expect((await ${locator}.getAttribute("${attr}"))).toMatch(/${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('attr', '${attr}').should('match', /${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getAttribute('${attr}').endsWith("${val}"));`;
    } else if (target === 'text') {
      if (framework === 'playwright') return `expect(await ${locator}.textContent()).toMatch(/${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('text').should('match', /${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getText().endsWith("${val}"));`;
    } else if (target === 'value') {
      if (framework === 'playwright') return `expect(await ${locator}.inputValue()).toMatch(/${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('val').should('match', /${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getAttribute('value').endsWith("${val}"));`;
    }
  }

  // nth-child/nth-of-type (basic)
  m = text.match(/is the (\d+)(st|nd|rd|th) child/);
  if (m) {
    const n = parseInt(m[1]);
    if (framework === 'playwright') return `await expect(${locator}:nth-child(${n})).toBeVisible();`;
    if (framework === 'cypress') return `cy.get('${selector}:nth-child(${n})').should('exist');`;
    if (framework === 'selenium') return `assert(driver.findElements(By.cssSelector('${selector}:nth-child(${n})')).length > 0);`;
  }

  // Conditional logic: if ... then ...
  m = text.match(/if (.+?),? then (.+)/);
  if (m) {
    const condition = parseCustomAssertion(m[1], framework, selector, locator);
    const action = parseCustomAssertion(m[2], framework, selector, locator) || m[2];
    if (framework === 'playwright') return `if (${condition}) {\n  ${action}\n}`;
    if (framework === 'cypress') return `cy.then(() => { if (${condition}) { ${action} } });`;
    if (framework === 'selenium') return `if (${condition}) {\n  ${action}\n}`;
  }

  // Wait/retry logic
  m = text.match(/wait (up to|for)? ?(\d+) (seconds|second|ms|milliseconds) for (.+)/);
  if (m) {
    const time = parseInt(m[2]);
    const ms = m[3].startsWith('s') ? time * 1000 : time;
    const what = m[4];
    if (framework === 'playwright') return `await ${locator}.waitFor({ timeout: ${ms} }); // waiting for ${what}`;
    if (framework === 'cypress') return `cy.get('${selector}', { timeout: ${ms} }); // waiting for ${what}`;
    if (framework === 'selenium') return `await driver.wait(until.elementLocated(By.cssSelector('${selector}')), ${ms}); // waiting for ${what}`;
  }

  // Retry until ...
  m = text.match(/retry until (.+)/);
  if (m) {
    const until = m[1];
    if (framework === 'playwright') return `// Retry logic: while (!(await (${parseCustomAssertion(until, framework, selector, locator)}))) { /* retry */ }`;
    if (framework === 'cypress') return `// Retry logic: use cy.retry-until plugin or custom loop for: ${until}`;
    if (framework === 'selenium') return `// Retry logic: while (!(await (${parseCustomAssertion(until, framework, selector, locator)}))) { /* retry */ }`;
  }

  // Reporting/logging
  m = text.match(/report ['"](.+)['"]( if (.+))?/);
  if (m) {
    const msg = m[1];
    const cond = m[3] ? parseCustomAssertion(m[3], framework, selector, locator) : null;
    if (framework === 'playwright') return cond ? `if (${cond}) { console.log('${msg}'); }` : `console.log('${msg}');`;
    if (framework === 'cypress') return cond ? `if (${cond}) { cy.log('${msg}'); }` : `cy.log('${msg}');`;
    if (framework === 'selenium') return cond ? `if (${cond}) { console.log('${msg}'); }` : `console.log('${msg}');`;
  }

  // Error handling: on failure ...
  m = text.match(/on failure,? (.+)/);
  if (m) {
    const handler = m[1];
    if (framework === 'playwright') return `try {\n  // assertion\n} catch (e) {\n  ${handler}\n}`;
    if (framework === 'cypress') return `Cypress.on('fail', (e) => { ${handler}; throw e; });`;
    if (framework === 'selenium') return `try {\n  // assertion\n} catch (e) {\n  ${handler}\n}`;
  }

  // Existing patterns (negations, attribute, text, value, contains, count, checked, enabled, etc.)
  // ... (keep all existing code here)

  return null;
}

export function generateAutomationScript(actions, config) {
  if (!actions || !actions.length) return '// No actions selected.';
  if (!config) {
    // Fallback to plain JS
    return actions.map(a => {
      if (a.type === 'click') {
        return `document.querySelector(\"${a.selector}\").click();`;
      } else if (a.type === 'input') {
        return `document.querySelector(\"${a.selector}\").value = \"${a.value}\";`;
      } else if (a.assert) {
        return `// Assertion not supported in plain JS`;
      }
      return '';
    }).join('\n');
  }
  const parsed = parseConfig(config);
  let lines = [];
  // Framework headers
  if (parsed.framework === 'playwright') {
    lines.push("// Playwright script generated");
    lines.push("import { test, expect } from '@playwright/test';");
    lines.push('test(\'automation\', async ({ page }) => {');
  } else if (parsed.framework === 'cypress') {
    lines.push('// Cypress script generated');
  } else if (parsed.framework === 'selenium') {
    lines.push('// Selenium script generated');
    lines.push('const {Builder, By, until} = require("selenium-webdriver");');
    lines.push('let driver = new Builder().forBrowser("chrome").build();');
    lines.push('(async function run() {');
  }
  actions.forEach(a => {
    const locator = getLocator(a.selector, parsed.locatorMap, parsed.framework);
    if (a.assert) {
      // Assertion with type
      let assertType = a.assertType || 'exists';
      let assertTemplate = getAssertionTemplate(assertType, parsed.actionTemplates);
      let line = assertTemplate.replace('{locator}', locator).replace('{selector}', a.selector);
      if (a.value) line = line.replace('{value}', a.value);
      let customCode = null;
      if (a.assertInstruction && a.assertInstruction.trim()) {
        customCode = parseCustomAssertion(a.assertInstruction, parsed.framework, a.selector, locator);
  if (!instruction) return null;
  const text = instruction.trim().toLowerCase();

  // Compound (simple AND)
  if (text.includes(' and ')) {
    const parts = text.split(/\s+and\s+/);
    return parts.map(part => parseCustomAssertion(part, framework, selector, locator)).filter(Boolean).join('\n  ');
  }

  // Compound (simple OR)
  if (text.includes(' or ')) {
    const parts = text.split(/\s+or\s+/);
    const codeLines = parts.map(part => parseCustomAssertion(part, framework, selector, locator)).filter(Boolean);
    if (codeLines.length > 1) {
      // For code, output as comment block for manual handling
      return [
        '// At least one of the following should pass:',
        ...codeLines.map(l => '//   ' + l)
      ].join('\n  ');
    }
  }

  // Not contains (text, value, attr)
  let m = text.match(/(text|value|attribute ([\w-]+)) does not contain ['"]?(.+?)['"]?$/);
  if (m) {
    const target = m[1], attr = m[2], val = m[3];
    if (target.startsWith('attribute')) {
      if (framework === 'playwright') return `expect((await ${locator}.getAttribute("${attr}"))).not.toContain("${val}");`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('attr', '${attr}').should('not.contain', "${val}");`;
      if (framework === 'selenium') return `assert(!driver.findElement(By.cssSelector('${selector}')).getAttribute('${attr}').includes("${val}"));`;
    } else if (target === 'text') {
      if (framework === 'playwright') return `expect(await ${locator}.textContent()).not.toContain("${val}");`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('text').should('not.contain', "${val}");`;
      if (framework === 'selenium') return `assert(!driver.findElement(By.cssSelector('${selector}')).getText().includes("${val}"));`;
    } else if (target === 'value') {
      if (framework === 'playwright') return `expect(await ${locator}.inputValue()).not.toContain("${val}");`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('val').should('not.contain', "${val}");`;
      if (framework === 'selenium') return `assert(!driver.findElement(By.cssSelector('${selector}')).getAttribute('value').includes("${val}"));`;
    }
  }

  // Starts with (text, value, attr)
  m = text.match(/(text|value|attribute ([\w-]+)) starts with ['"]?(.+?)['"]?$/);
  if (m) {
    const target = m[1], attr = m[2], val = m[3];
    if (target.startsWith('attribute')) {
      if (framework === 'playwright') return `expect((await ${locator}.getAttribute("${attr}"))).toMatch(/^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('attr', '${attr}').should('match', /^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getAttribute('${attr}').startsWith("${val}"));`;
    } else if (target === 'text') {
      if (framework === 'playwright') return `expect(await ${locator}.textContent()).toMatch(/^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('text').should('match', /^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getText().startsWith("${val}"));`;
    } else if (target === 'value') {
      if (framework === 'playwright') return `expect(await ${locator}.inputValue()).toMatch(/^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('val').should('match', /^${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getAttribute('value').startsWith("${val}"));`;
    }
  }

  // Ends with (text, value, attr)
  m = text.match(/(text|value|attribute ([\w-]+)) ends with ['"]?(.+?)['"]?$/);
  if (m) {
    const target = m[1], attr = m[2], val = m[3];
    if (target.startsWith('attribute')) {
      if (framework === 'playwright') return `expect((await ${locator}.getAttribute("${attr}"))).toMatch(/${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('attr', '${attr}').should('match', /${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getAttribute('${attr}').endsWith("${val}"));`;
    } else if (target === 'text') {
      if (framework === 'playwright') return `expect(await ${locator}.textContent()).toMatch(/${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('text').should('match', /${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getText().endsWith("${val}"));`;
    } else if (target === 'value') {
      if (framework === 'playwright') return `expect(await ${locator}.inputValue()).toMatch(/${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'cypress') return `cy.get('${selector}').invoke('val').should('match', /${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$ /);`;
      if (framework === 'selenium') return `assert(driver.findElement(By.cssSelector('${selector}')).getAttribute('value').endsWith("${val}"));`;
    }
  }

  // nth-child/nth-of-type (basic)
  m = text.match(/is the (\d+)(st|nd|rd|th) child/);
  if (m) {
    const n = parseInt(m[1]);
    if (framework === 'playwright') return `await expect(${locator}:nth-child(${n})).toBeVisible();`;
    if (framework === 'cypress') return `cy.get('${selector}:nth-child(${n})').should('exist');`;
    if (framework === 'selenium') return `assert(driver.findElements(By.cssSelector('${selector}:nth-child(${n})')).length > 0);`;
  }

  // Conditional logic: if ... then ...
  m = text.match(/if (.+?),? then (.+)/);
  if (m) {
    const condition = parseCustomAssertion(m[1], framework, selector, locator);
    const action = parseCustomAssertion(m[2], framework, selector, locator) || m[2];
    if (framework === 'playwright') return `if (${condition}) {\n  ${action}\n}`;
    if (framework === 'cypress') return `cy.then(() => { if (${condition}) { ${action} } });`;
    if (framework === 'selenium') return `if (${condition}) {\n  ${action}\n}`;
  }

  // Wait/retry logic
  m = text.match(/wait (up to|for)? ?(\d+) (seconds|second|ms|milliseconds) for (.+)/);
  if (m) {
    const time = parseInt(m[2]);
    const ms = m[3].startsWith('s') ? time * 1000 : time;
    const what = m[4];
    if (framework === 'playwright') return `await ${locator}.waitFor({ timeout: ${ms} }); // waiting for ${what}`;
    if (framework === 'cypress') return `cy.get('${selector}', { timeout: ${ms} }); // waiting for ${what}`;
    if (framework === 'selenium') return `await driver.wait(until.elementLocated(By.cssSelector('${selector}')), ${ms}); // waiting for ${what}`;
  }

  // Retry until ...
  m = text.match(/retry until (.+)/);
  if (m) {
    const until = m[1];
    if (framework === 'playwright') return `// Retry logic: while (!(await (${parseCustomAssertion(until, framework, selector, locator)}))) { /* retry */ }`;
    if (framework === 'cypress') return `// Retry logic: use cy.retry-until plugin or custom loop for: ${until}`;
    if (framework === 'selenium') return `// Retry logic: while (!(await (${parseCustomAssertion(until, framework, selector, locator)}))) { /* retry */ }`;
  }

  // Reporting/logging
  m = text.match(/report ['"](.+)['"]( if (.+))?/);
  if (m) {
    const msg = m[1];
    const cond = m[3] ? parseCustomAssertion(m[3], framework, selector, locator) : null;
    if (framework === 'playwright') return cond ? `if (${cond}) { console.log('${msg}'); }` : `console.log('${msg}');`;
    if (framework === 'cypress') return cond ? `if (${cond}) { cy.log('${msg}'); }` : `cy.log('${msg}');`;
    if (framework === 'selenium') return cond ? `if (${cond}) { console.log('${msg}'); }` : `console.log('${msg}');`;
  }

  // Error handling: on failure ...
  m = text.match(/on failure,? (.+)/);
  if (m) {
    const handler = m[1];
    if (framework === 'playwright') return `try {\n  // assertion\n} catch (e) {\n  ${handler}\n}`;
    if (framework === 'cypress') return `Cypress.on('fail', (e) => { ${handler}; throw e; });`;
    if (framework === 'selenium') return `try {\n  // assertion\n} catch (e) {\n  ${handler}\n}`;
  }

      }
      if (customCode) {
        lines.push('  ' + customCode);
      } else {
        lines.push('  ' + line);
        if (a.assertInstruction && a.assertInstruction.trim()) {
          lines.push('  // User validation: ' + a.assertInstruction.trim());
        }
      }
    } else {
      // Normal action
      const template = getActionTemplate(a.type, parsed.actionTemplates);
      let line = template.replace('{locator}', locator).replace('{selector}', a.selector);
      if (a.value) line = line.replace('{value}', a.value);
      lines.push('  ' + line);
    }
  });
  // Framework footers
  if (parsed.framework === 'playwright') {
    lines.push('});');
  } else if (parsed.framework === 'selenium') {
    lines.push('})();');
  }
  return lines.join('\n');
}
