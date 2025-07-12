// popup.js
// Handles UI events and script generation

document.getElementById('startBtn').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { type: 'startRecording' }, (response) => {
    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
  });
};

document.getElementById('stopBtn').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { type: 'stopRecording' }, (response) => {
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    displayActions(response.actions || []);
  });
};

let repoConfig = null;
document.getElementById('repoConfig').onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      repoConfig = JSON.parse(event.target.result);
      chrome.runtime.sendMessage({ type: 'saveConfig', config: repoConfig });
    } catch (err) {
      alert('Invalid config file');
    }
  };
  reader.readAsText(file);
};

document.getElementById('generateBtn').onclick = async () => {
  chrome.runtime.sendMessage({ type: 'getActions' }, (response) => {
    chrome.runtime.sendMessage({ type: 'getConfig' }, async (cfg) => {
      const actions = response.actions || [];
      const selectedIndexes = Array.from(document.querySelectorAll('.action-checkbox:checked')).map(cb => parseInt(cb.value));
      const assertIndexes = Array.from(document.querySelectorAll('.assert-checkbox:checked')).map(cb => parseInt(cb.value));
      const selectorInputs = Array.from(document.querySelectorAll('.selector-input'));
      const assertTypeSelects = Array.from(document.querySelectorAll('.assert-type'));
      const instructionInputs = Array.from(document.querySelectorAll('.assert-instruction'));
      const selectedActions = selectedIndexes.map(i => {
        const a = { ...actions[i] };
        // Use edited selector
        a.selector = selectorInputs[i].value;
        // Assertion
        if (assertIndexes.includes(i)) {
          a.assert = true;
          a.assertType = assertTypeSelects[i].value;
          a.assertInstruction = instructionInputs[i].value;
        }
        return a;
      });
      const script = await generateScript(selectedActions, cfg.config);
      document.getElementById('output').textContent = script;
      document.getElementById('downloadBtn').style.display = 'inline-block';
    });
  });
};

document.getElementById('downloadBtn').onclick = () => {
  const script = document.getElementById('output').textContent;
  const blob = new Blob([script], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'automation-script.js';
  a.click();
  URL.revokeObjectURL(url);
};

function displayActions(actions) {
  const form = document.getElementById('actionsForm');
  form.innerHTML = '';
  if (!actions.length) {
    form.innerHTML = '<em>No actions recorded.</em>';
    return;
  }
  actions.forEach((action, idx) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';

    // Action select checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'action-checkbox';
    checkbox.value = idx;
    checkbox.checked = true;
    row.appendChild(checkbox);

    // Editable selector
    const selectorInput = document.createElement('input');
    selectorInput.type = 'text';
    selectorInput.className = 'selector-input';
    selectorInput.value = action.selector;
    selectorInput.style.width = '220px';
    selectorInput.title = 'Edit selector';
    row.appendChild(selectorInput);

    // Action description
    const desc = document.createElement('span');
    desc.textContent = ` [${action.type}] ${action.tag}${action.value ? ' = ' + action.value : ''}`;
    row.appendChild(desc);

    // Assert checkbox
    const assertCheckbox = document.createElement('input');
    assertCheckbox.type = 'checkbox';
    assertCheckbox.className = 'assert-checkbox';
    assertCheckbox.value = idx;
    assertCheckbox.title = 'Assert';
    row.appendChild(assertCheckbox);

    const assertLabel = document.createElement('label');
    assertLabel.textContent = 'Assert';
    row.appendChild(assertLabel);

    // Assertion type dropdown
    const assertTypeSelect = document.createElement('select');
    assertTypeSelect.className = 'assert-type';
    ['exists', 'has text', 'value is'].forEach(type => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type;
      assertTypeSelect.appendChild(opt);
    });
    assertTypeSelect.disabled = true;
    row.appendChild(assertTypeSelect);

    // Enable/disable assertion type based on checkbox
    assertCheckbox.addEventListener('change', () => {
      assertTypeSelect.disabled = !assertCheckbox.checked;
      instructionInput.disabled = !assertCheckbox.checked;
    });

    // Custom assertion/validation instruction input
    const instructionInput = document.createElement('input');
    instructionInput.type = 'text';
    instructionInput.className = 'assert-instruction';
    instructionInput.placeholder = 'Custom assert/validation (optional)';
    instructionInput.style.width = '180px';
    instructionInput.disabled = true;
    row.appendChild(instructionInput);

    form.appendChild(row);
  });
}


async function generateScript(actions, config) {
  if (config) {
    // Dynamically import scriptGenerator.js for config-based output
    const module = await import('../scriptGenerator.js');
    return module.generateAutomationScript(actions, config);
  } else {
    // Simple JS script
    return actions.map(a => {
      if (a.type === 'click') {
        return `document.querySelector(\"${a.selector}\").click();`;
      } else if (a.type === 'input') {
        return `document.querySelector(\"${a.selector}\").value = \"${a.value}\";`;
      }
      return '';
    }).join('\n');
  }
}
