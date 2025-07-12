// configParser.js
// Parses repo config and provides mapping utilities

/**
 * Example config structure:
 * {
 *   "framework": "playwright",
 *   "locatorMap": { "#login": "page.locator('#login')" },
 *   "actions": {
 *     "click": "await {locator}.click()",
 *     "input": "await {locator}.fill('{value}')"
 *   }
 * }
 */

export function parseConfig(config) {
  // Default templates for supported frameworks
  const defaultTemplates = {
    plain: {
      click: '{locator}.click();',
      input: '{locator}.value = "{value}";',
      assert: {
        exists: '// No assertion syntax in plain JS',
        'has text': '// No assertion syntax in plain JS',
        'value is': '// No assertion syntax in plain JS'
      }
    },
    playwright: {
      click: 'await {locator}.click();',
      input: 'await {locator}.fill("{value}");',
      assert: {
        exists: 'await expect({locator}).toBeVisible();',
        'has text': 'await expect({locator}).toHaveText("{value}");',
        'value is': 'await expect({locator}).toHaveValue("{value}");'
      }
    },
    cypress: {
      click: 'cy.get("{selector}").click();',
      input: 'cy.get("{selector}").type("{value}");',
      assert: {
        exists: 'cy.get("{selector}").should("exist");',
        'has text': 'cy.get("{selector}").should("have.text", "{value}");',
        'value is': 'cy.get("{selector}").should("have.value", "{value}");'
      }
    },
    selenium: {
      click: 'driver.findElement(By.cssSelector("{selector}")).click();',
      input: 'driver.findElement(By.cssSelector("{selector}")).sendKeys("{value}");',
      assert: {
        exists: 'assert(driver.findElement(By.cssSelector("{selector}")).isDisplayed());',
        'has text': 'assert(driver.findElement(By.cssSelector("{selector}")).getText() === "{value}");',
        'value is': 'assert(driver.findElement(By.cssSelector("{selector}")).getAttribute("value") === "{value}");'
      }
    }
  };

  const framework = config.framework || 'plain';
  const locatorMap = config.locatorMap || {};
  // Merge user action templates with defaults
  const actionTemplates = { ...defaultTemplates[framework], ...(config.actions || {}) };
  return {
    framework,
    locatorMap,
    actionTemplates
  };
}

export function getAssertionTemplate(assertType, actionTemplates) {
  // Fallback to 'exists' if type is missing
  if (!actionTemplates.assert) return '';
  return actionTemplates.assert[assertType] || actionTemplates.assert['exists'] || '';
}

export function getLocator(selector, locatorMap, framework) {
  if (framework === 'cypress' || framework === 'selenium') {
    // For Cypress/Selenium, use selector directly
    return selector;
  }
  return locatorMap[selector] || `document.querySelector(\"${selector}\")`;
}

export function getActionTemplate(type, actionTemplates) {
  // Fallback to plain JS
  const defaults = {
    click: '{locator}.click();',
    input: '{locator}.value = "{value}";'
  };
  return actionTemplates[type] || defaults[type] || '';
}
