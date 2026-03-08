// =====================================================
// CRM SYSTEM - Complete Apps Script
// Copy and paste this ENTIRE file into Google Apps Script
// =====================================================

function onOpen() {
  SpreadsheetApp.getUi().createMenu('CRM')
    .addItem('Move Data to MasterList', 'moveDataToMasterList')
    .addItem('Sync Prospects', 'syncProspects')
    .addItem('Sync All Working Tabs', 'syncAllWorkingTabs')
    .addSeparator()
    .addItem("Setup Tom's Call Log", 'setupCallLogTom')
    .addItem("Setup Deneane's Call Log", 'setupCallLogDeneane')
    .addSeparator()
    .addItem("Refresh Tom's Today's Tasks", 'setupTodaysTasksTom')
    .addItem("Refresh Deneane's Today's Tasks", 'setupTodaysTasksDeneane')
    .addSeparator()
    .addItem('Setup Working Tab Formulas', 'addWorkingTabFormulas')
    .addSeparator()
    .addItem('🆔 Add Property IDs', 'addPropertyIds')
    .addSeparator()
    .addItem("Log Call - Tom's Working", 'openTomCallLogDialog')
    .addItem("Log Call - Deneane's Working", 'openDeneaneCallLogDialog')
    .addSeparator()
    .addItem('Clean Working Tabs (Remove Duplicates)', 'cleanWorkingTabs')
    .addItem('Fix Call Log Structure', 'fixCallLogStructure')
    .addItem('Fix/Verify Sheets', 'fixSheetStructure')
    .addSeparator()
    .addItem('Open Command Center Dashboard', 'launchCommandCenter')
    .addToUi();
}

// =====================================================
// EXISTING FUNCTIONS
// =====================================================

function moveDataToMasterList() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const searchedSheet = sheet.getSheetByName('Need to be Searched');
  const masterSheet = sheet.getSheetByName('MasterList');

  const searchedData = searchedSheet.getRange('A2:C').getValues();
  const lastRow = masterSheet.getLastRow();

  for (let i = 0; i < searchedData.length; i++) {
    const row = searchedData[i];
    if (row[0] || row[1] || row[2]) {
      masterSheet.getRange(lastRow + i + 1, 2, 1, 3).setValues([row]);
    }
  }

  searchedSheet.getRange('A2:C').clearContent();
  SpreadsheetApp.getUi().alert('Data moved to MasterList!');
}

function syncProspects() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = sheet.getSheetByName('MasterList');
  const prospectSheet = sheet.getSheetByName('Prospects');

  const masterData = masterSheet.getRange('A2:D' + masterSheet.getLastRow()).getValues();

  const prospectsToAdd = [];
  const rowsToUpdate = [];

  for (let i = 0; i < masterData.length; i++) {
    const row = masterData[i];
    if (row[0] === 'Prospect') {
      prospectsToAdd.push([row[1], row[2], '', row[3]]);
      rowsToUpdate.push(i + 2);
    }
  }

  if (prospectsToAdd.length > 0) {
    const lastRow = prospectSheet.getLastRow();
    prospectSheet.getRange(lastRow + 1, 2, prospectsToAdd.length, 4).setValues(prospectsToAdd);

    // Auto-generate Property IDs for new prospects
    const newLastRow = prospectSheet.getLastRow();
    for (let row = lastRow + 1; row <= newLastRow; row++) {
      const existingId = prospectSheet.getRange(row, 6).getValue(); // Column F
      if (!existingId) {
        const propertyId = 'P' + String(row - 1).padStart(4, '0');
        prospectSheet.getRange(row, 6).setValue(propertyId);
      }
    }

    for (let j = 0; j < rowsToUpdate.length; j++) {
      masterSheet.getRange(rowsToUpdate[j], 1).setValue('Pursue');
    }

    SpreadsheetApp.getUi().alert('Synced ' + prospectsToAdd.length + ' prospects with auto-generated IDs!');
  } else {
    SpreadsheetApp.getUi().alert('No prospects found');
  }
}

function syncAllWorkingTabs() {
  syncToWorkingTab('Tom', "Tom's Working");
  syncToWorkingTab('Deneane', "D's Working");
  SpreadsheetApp.getUi().alert('All working tabs synced!');
}

function syncToWorkingTab(name, tabName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const prospectSheet = sheet.getSheetByName('Prospects');
  const workingSheet = sheet.getSheetByName(tabName);

  const prospectData = prospectSheet.getRange('A2:E' + prospectSheet.getLastRow()).getValues();

  const rowsToMove = [];
  const rowsToDelete = [];

  for (let i = 0; i < prospectData.length; i++) {
    if (prospectData[i][0] === name) {
      rowsToMove.push([prospectData[i][1], prospectData[i][2], prospectData[i][3], prospectData[i][4]]);
      rowsToDelete.push(i + 2);
    }
  }

  if (rowsToMove.length > 0) {
    const lastRow = workingSheet.getLastRow();
    workingSheet.getRange(lastRow + 1, 2, rowsToMove.length, 4).setValues(rowsToMove);

    for (let j = rowsToDelete.length - 1; j >= 0; j--) {
      prospectSheet.deleteRow(rowsToDelete[j]);
    }
  }
}

// =====================================================
// CALL LOG FUNCTIONS
// =====================================================

function setupCallLogTom() {
  setupCallLog("Tom");
}

function setupCallLogDeneane() {
  setupCallLog("Deneane");
}

function setupCallLog(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "Call Log - " + name;

  let callLogSheet = ss.getSheetByName(sheetName);
  if (!callLogSheet) {
    callLogSheet = ss.insertSheet(sheetName);
  } else {
    callLogSheet.clear();
  }

  const headers = ['Date Called', 'Property Address', 'Property Name', 'Number of Units', 'Interaction Type', 'Spoke With', 'Manager First Name', 'Manager Last Name', 'Manager Email', 'Notes', 'Next Follow-up Date'];
  callLogSheet.getRange(1, 1, 1, 11).setValues([headers]);

  const headerRange = callLogSheet.getRange(1, 1, 1, 11);
  headerRange.setBackground('#366092');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');

  for (let i = 1; i <= 11; i++) {
    callLogSheet.setColumnWidth(i, 130);
  }

  const allRange = callLogSheet.getRange(1, 1, callLogSheet.getMaxRows(), 11);
  allRange.clearDataValidations();

  const interactionRange = callLogSheet.getRange('E2:E1000');
  const interactionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Spoke With', 'Voicemail', 'No Answer', 'Wrong Number'])
    .setAllowInvalid(false)
    .build();
  interactionRange.setDataValidation(interactionRule);

  const dataRange = callLogSheet.getRange('E2:E1000');

  const greenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$E2="Spoke With"')
    .setBackground('#34A853')
    .setFontColor('#FFFFFF')
    .setRanges([dataRange])
    .build();

  const yellowRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$E2="Voicemail"')
    .setBackground('#FBBC04')
    .setFontColor('#000000')
    .setRanges([dataRange])
    .build();

  const redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$E2="No Answer"')
    .setBackground('#EA4335')
    .setFontColor('#FFFFFF')
    .setRanges([dataRange])
    .build();

  const grayRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$E2="Wrong Number"')
    .setBackground('#9AA0A6')
    .setFontColor('#FFFFFF')
    .setRanges([dataRange])
    .build();

  callLogSheet.setConditionalFormatRules([greenRule, yellowRule, redRule, grayRule]);
  callLogSheet.setFrozenRows(1);

  SpreadsheetApp.getUi().alert(name + "'s Call Log sheet created successfully!");
}

function setupTodaysTasksTom() {
  setupTodaysTasks("Tom");
}

function setupTodaysTasksDeneane() {
  setupTodaysTasks("Deneane");
}

function setupTodaysTasks(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "Today's Tasks - " + name;
  const callLogSheetName = "Call Log - " + name;

  let todaysTasksSheet = ss.getSheetByName(sheetName);
  if (!todaysTasksSheet) {
    todaysTasksSheet = ss.insertSheet(sheetName);
  } else {
    todaysTasksSheet.clear();
  }

  const headers = ['Property Name', 'Address', 'Last Interaction', 'Next Follow-up Date'];
  todaysTasksSheet.getRange(1, 1, 1, 4).setValues([headers]);

  const headerRange = todaysTasksSheet.getRange(1, 1, 1, 4);
  headerRange.setBackground('#366092');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');

  todaysTasksSheet.setColumnWidth(1, 150);
  todaysTasksSheet.setColumnWidth(2, 200);
  todaysTasksSheet.setColumnWidth(3, 130);
  todaysTasksSheet.setColumnWidth(4, 130);

  const callLogSheet = ss.getSheetByName(callLogSheetName);
  if (callLogSheet) {
    const propertyFormula = '=IFERROR(FILTER(\'' + callLogSheetName + '\'!C:C,\'' + callLogSheetName + '\'!K:K<=TODAY(),\'' + callLogSheetName + '\'!K:K<>""),"")';
    todaysTasksSheet.getRange('A2').setFormula(propertyFormula);

    const addressFormula = '=IFERROR(FILTER(\'' + callLogSheetName + '\'!B:B,\'' + callLogSheetName + '\'!K:K<=TODAY(),\'' + callLogSheetName + '\'!K:K<>""),"")';
    todaysTasksSheet.getRange('B2').setFormula(addressFormula);

    const interactionFormula = '=IFERROR(FILTER(\'' + callLogSheetName + '\'!E:E,\'' + callLogSheetName + '\'!K:K<=TODAY(),\'' + callLogSheetName + '\'!K:K<>""),"")';
    todaysTasksSheet.getRange('C2').setFormula(interactionFormula);

    const dateFormula = '=IFERROR(FILTER(\'' + callLogSheetName + '\'!K:K,\'' + callLogSheetName + '\'!K:K<=TODAY(),\'' + callLogSheetName + '\'!K:K<>""),"")';
    todaysTasksSheet.getRange('D2').setFormula(dateFormula);
  }

  todaysTasksSheet.setFrozenRows(1);
  SpreadsheetApp.getUi().alert(name + "'s Today's Tasks sheet refreshed!");
}

function addWorkingTabFormulas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabMapping = {
    "T's Working": "Call Log - Tom",
    "D's Working": "Call Log - Deneane"
  };

  for (let tabName in tabMapping) {
    const callLogName = tabMapping[tabName];
    const workingSheet = ss.getSheetByName(tabName);
    if (!workingSheet) continue;

    const lastRow = workingSheet.getLastRow();
    const lastCol = workingSheet.getLastColumn();

    if (lastCol > 5) {
      workingSheet.deleteColumns(6, lastCol - 5);
    }

    workingSheet.getRange(1, 6).setValue('Manager First Name');
    workingSheet.getRange(1, 7).setValue('Manager Last Name');
    workingSheet.getRange(1, 8).setValue('Manager Email');
    workingSheet.getRange(1, 9).setValue('Last Contact Date');
    workingSheet.getRange(1, 10).setValue('Last Interaction');
    workingSheet.getRange(1, 11).setValue('Next Follow-up Date');

    for (let row = 2; row <= lastRow; row++) {
      const addressCell = workingSheet.getRange(row, 3);
      const address = addressCell.getValue();

      if (address) {
        const mgrFirstFormula = `=IFERROR(XLOOKUP("${address}",'${callLogName}'!B:B,'${callLogName}'!G:G),"")`;
        workingSheet.getRange(row, 6).setFormula(mgrFirstFormula);

        const mgrLastFormula = `=IFERROR(XLOOKUP("${address}",'${callLogName}'!B:B,'${callLogName}'!H:H),"")`;
        workingSheet.getRange(row, 7).setFormula(mgrLastFormula);

        const mgrEmailFormula = `=IFERROR(XLOOKUP("${address}",'${callLogName}'!B:B,'${callLogName}'!I:I),"")`;
        workingSheet.getRange(row, 8).setFormula(mgrEmailFormula);

        const lastContactFormula = `=IFERROR(TEXT(XLOOKUP("${address}",'${callLogName}'!B:B,'${callLogName}'!A:A),"MM/DD/YYYY"),"")`;
        workingSheet.getRange(row, 9).setFormula(lastContactFormula);

        const lastInteractionFormula = `=IFERROR(XLOOKUP("${address}",'${callLogName}'!B:B,'${callLogName}'!E:E),"")`;
        workingSheet.getRange(row, 10).setFormula(lastInteractionFormula);

        const nextFollowupFormula = `=IFERROR(TEXT(XLOOKUP("${address}",'${callLogName}'!B:B,'${callLogName}'!K:K),"MM/DD/YYYY"),"")`;
        workingSheet.getRange(row, 11).setFormula(nextFollowupFormula);
      }
    }
  }

  SpreadsheetApp.getUi().alert('Working tab formulas added successfully!');
}

function openTomCallLogDialog() {
  openCallLogDialog("Tom");
}

function openDeneaneCallLogDialog() {
  openCallLogDialog("Deneane");
}

function openCallLogDialog(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const workingSheet = ss.getSheetByName(name === "Tom" ? "T's Working" : "D's Working");

  if (!workingSheet) {
    SpreadsheetApp.getUi().alert("Working sheet not found!");
    return;
  }

  const data = workingSheet.getRange('B2:D' + workingSheet.getLastRow()).getValues();
  const properties = [];

  for (let i = 0; i < data.length; i++) {
    const propName = data[i][0];
    const propAddress = data[i][1];
    const numUnits = data[i][2];
    if (propName && propAddress) {
      properties.push({
        name: propName,
        address: propAddress,
        units: numUnits || ''
      });
    }
  }

  const html = `
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
      label { display: block; margin-top: 15px; font-weight: bold; color: #333; }
      input, select, textarea { width: 100%; padding: 10px; margin-top: 5px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; font-family: Arial; }
      textarea { height: 80px; resize: vertical; }
      button { background-color: #4285F4; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px; width: 100%; font-weight: bold; font-size: 16px; }
      button:hover { background-color: #1f51ba; }
      #propNameField, #propAddressField, #numUnitsField { background-color: #f0f0f0; }
      .section-title { margin-top: 25px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 15px; color: #333; }
      h2 { color: #333; text-align: center; }
    </style>

    <h2>Log a Call - ${name}'s Working</h2>

    <label for="propertySelect">Select Property:</label>
    <select id="propertySelect" onchange="updatePropertyFields()">
      <option value="">-- Select a property --</option>
      ${properties.map((p, i) => `<option value="${i}">${p.name} (${p.address})</option>`).join('')}
    </select>

    <label for="propNameField">Property Name:</label>
    <input type="text" id="propNameField" readonly>

    <label for="propAddressField">Property Address:</label>
    <input type="text" id="propAddressField" readonly>

    <label for="numUnitsField">Number of Units:</label>
    <input type="text" id="numUnitsField" placeholder="Enter or edit units">

    <label for="dateCalledField">Date Called (MM/DD/YYYY):</label>
    <input type="text" id="dateCalledField" onchange="calculateNextFollowup()">

    <div class="section-title">Contact Information</div>

    <label for="interactionTypeField">Interaction Type:</label>
    <select id="interactionTypeField">
      <option value="">-- Select --</option>
      <option value="Spoke With">Spoke With</option>
      <option value="Voicemail">Voicemail</option>
      <option value="No Answer">No Answer</option>
      <option value="Wrong Number">Wrong Number</option>
    </select>

    <label for="spokeWithField">Spoke With (Person/Title):</label>
    <input type="text" id="spokeWithField" placeholder="e.g., Front Desk, Manager, etc.">

    <div class="section-title">Property Manager Details</div>

    <label for="mgrFirstField">Manager First Name:</label>
    <input type="text" id="mgrFirstField">

    <label for="mgrLastField">Manager Last Name:</label>
    <input type="text" id="mgrLastField">

    <label for="mgrEmailField">Manager Email:</label>
    <input type="text" id="mgrEmailField" placeholder="manager@email.com">

    <div class="section-title">Call Notes</div>

    <label for="notesField">Notes:</label>
    <textarea id="notesField"></textarea>

    <label for="nextFollowupField">Next Follow-up Date (MM/DD/YYYY):</label>
    <input type="text" id="nextFollowupField" placeholder="03/14/2026">

    <button onclick="submitCallLog()">Submit Call Log</button>

    <script>
      const properties = ${JSON.stringify(properties)};

      function setTodayDate() {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const year = today.getFullYear();
        document.getElementById('dateCalledField').value = month + '/' + day + '/' + year;
        calculateNextFollowup();
      }

      function calculateNextFollowup() {
        const dateInput = document.getElementById('dateCalledField').value;
        if (!dateInput) return;

        const [month, day, year] = dateInput.split('/');
        const callDate = new Date(year, month - 1, day);
        const nextDate = new Date(callDate.getTime() + (7 * 24 * 60 * 60 * 1000));

        const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
        const nextDay = String(nextDate.getDate()).padStart(2, '0');
        const nextYear = nextDate.getFullYear();
        document.getElementById('nextFollowupField').value = nextMonth + '/' + nextDay + '/' + nextYear;
      }

      function updatePropertyFields() {
        const select = document.getElementById('propertySelect');
        const index = select.value;

        if (index === '') {
          document.getElementById('propNameField').value = '';
          document.getElementById('propAddressField').value = '';
          document.getElementById('numUnitsField').value = '';
        } else {
          document.getElementById('propNameField').value = properties[index].name;
          document.getElementById('propAddressField').value = properties[index].address;
          document.getElementById('numUnitsField').value = properties[index].units;
        }
      }

      window.onload = setTodayDate;

      function submitCallLog() {
        const propName = document.getElementById('propNameField').value;
        const propAddress = document.getElementById('propAddressField').value;
        const numUnits = document.getElementById('numUnitsField').value;
        const dateCalled = document.getElementById('dateCalledField').value;
        const interactionType = document.getElementById('interactionTypeField').value;
        const spokeWith = document.getElementById('spokeWithField').value;
        const mgrFirst = document.getElementById('mgrFirstField').value;
        const mgrLast = document.getElementById('mgrLastField').value;
        const mgrEmail = document.getElementById('mgrEmailField').value;
        const notes = document.getElementById('notesField').value;
        const nextFollowup = document.getElementById('nextFollowupField').value;

        if (!propName || !propAddress || !dateCalled || !interactionType || !nextFollowup) {
          alert('Please fill in all required fields (Property, Date, Interaction Type, Follow-up Date)');
          return;
        }

        google.script.run.addCallLogEntry("${name}", propName, propAddress, numUnits, dateCalled, interactionType, spokeWith, mgrFirst, mgrLast, mgrEmail, notes, nextFollowup);
      }
    </script>
  `;

  const dialogBox = HtmlService.createHtmlOutput(html)
    .setWidth(420)
    .setHeight(1000);
  SpreadsheetApp.getUi().showModalDialog(dialogBox, "Log Call");
}

function addCallLogEntry(name, propName, propAddress, numUnits, dateCalled, interactionType, spokeWith, mgrFirst, mgrLast, mgrEmail, notes, nextFollowup) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const callLogSheetName = "Call Log - " + name;
  const callLogSheet = ss.getSheetByName(callLogSheetName);

  if (!callLogSheet) {
    SpreadsheetApp.getUi().alert("Call Log sheet not found!");
    return;
  }

  const lastRow = callLogSheet.getLastRow();
  const newRow = lastRow + 1;

  callLogSheet.getRange(newRow, 1, 1, 11).setValues([[dateCalled, propAddress, propName, numUnits, interactionType, spokeWith, mgrFirst, mgrLast, mgrEmail, notes, nextFollowup]]);

  SpreadsheetApp.getUi().alert("Call logged successfully!");
}

function fixCallLogStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const callLogNames = ["Call Log - Tom", "Call Log - Deneane"];

  for (let callLogName of callLogNames) {
    const sheet = ss.getSheetByName(callLogName);
    if (!sheet) continue;

    const range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn());
    range.clearDataValidations();

    const headers = ['Date Called', 'Property Address', 'Property Name', 'Number of Units', 'Interaction Type', 'Spoke With', 'Manager First Name', 'Manager Last Name', 'Manager Email', 'Notes', 'Next Follow-up Date'];
    sheet.getRange(1, 1, 1, 11).setValues([headers]);

    const interactionRange = sheet.getRange('E2:E1000');
    const interactionRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Spoke With', 'Voicemail', 'No Answer', 'Wrong Number'])
      .setAllowInvalid(false)
      .build();
    interactionRange.setDataValidation(interactionRule);

    const dataRange = sheet.getRange('E2:E1000');

    const greenRule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$E2="Spoke With"')
      .setBackground('#34A853')
      .setFontColor('#FFFFFF')
      .setRanges([dataRange])
      .build();

    const yellowRule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$E2="Voicemail"')
      .setBackground('#FBBC04')
      .setFontColor('#000000')
      .setRanges([dataRange])
      .build();

    const redRule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$E2="No Answer"')
      .setBackground('#EA4335')
      .setFontColor('#FFFFFF')
      .setRanges([dataRange])
      .build();

    const grayRule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$E2="Wrong Number"')
      .setBackground('#9AA0A6')
      .setFontColor('#FFFFFF')
      .setRanges([dataRange])
      .build();

    sheet.setConditionalFormatRules([greenRule, yellowRule, redRule, grayRule]);
  }

  SpreadsheetApp.getUi().alert('Call Log structure fixed!');
}

function cleanWorkingTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const workingTabNames = ["Tom's Working", "D's Working"];

  for (let tabName of workingTabNames) {
    const sheet = ss.getSheetByName(tabName);
    if (sheet) {
      const lastCol = sheet.getLastColumn();
      if (lastCol > 5) {
        sheet.deleteColumns(6, lastCol - 5);
      }
    }
  }

  SpreadsheetApp.getUi().alert('All extra columns deleted!');
}

function fixSheetStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const callLogNames = ["Call Log - Tom", "Call Log - Deneane"];
  for (let callLogName of callLogNames) {
    const sheet = ss.getSheetByName(callLogName);
    if (sheet) {
      const expectedHeaders = ['Date Called', 'Property Address', 'Property Name', 'Number of Units', 'Interaction Type', 'Spoke With', 'Manager First Name', 'Manager Last Name', 'Manager Email', 'Notes', 'Next Follow-up Date'];
      const currentHeaders = sheet.getRange(1, 1, 1, 11).getValues()[0];

      if (currentHeaders.join(',') !== expectedHeaders.join(',')) {
        sheet.getRange(1, 1, 1, 11).setValues([expectedHeaders]);
      }
    }
  }

  SpreadsheetApp.getUi().alert('Call Log sheets verified and fixed!');
}

// =====================================================
// COMMAND CENTER DASHBOARD
// =====================================================

function launchCommandCenter() {
  // Get data first
  const data = getDashboardData();
  const dataJson = JSON.stringify(data);

  const htmlString = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>CRM Dashboard</title><script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"><\/script><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;background:#1a2332;color:#e0e0e0;padding:20px}.container{max-width:1400px;margin:0 auto}h1{color:#fff;margin-bottom:10px}h2{color:#fff;font-size:18px;margin-bottom:15px;text-transform:uppercase}.welcome{color:#a0aec0;margin-bottom:30px}.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:30px}.stat-card{background:#1e2d42;border:1px solid #2a3f5f;padding:20px;border-radius:10px}.stat-label{color:#a0aec0;font-size:12px;text-transform:uppercase;margin-bottom:10px}.stat-value{font-size:36px;font-weight:700;color:#fff}.stat-sub{color:#4fa3ff;font-size:12px;margin-top:5px}.card{background:#1e2d42;border:1px solid #2a3f5f;border-radius:10px;padding:20px;margin-bottom:20px}.grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:20px}.table-wrapper{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:13px}thead{border-bottom:2px solid #2a3f5f}th{padding:12px;text-align:left;font-weight:600;color:#a0aec0;font-size:11px;text-transform:uppercase}td{padding:12px;border-bottom:1px solid #2a3f5f;color:#e0e0e0}tbody tr:hover{background:#263549}.badge{display:inline-block;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600}.badge-spoke{background:rgba(52,168,83,0.2);color:#34A853}.badge-voicemail{background:rgba(251,188,4,0.2);color:#FBBC04}.badge-noanswer{background:rgba(234,67,53,0.2);color:#EA4335}.badge-wrongnumber{background:rgba(154,160,166,0.2);color:#9AA0A6}.status-overdue{background:rgba(239,68,68,0.2);color:#ff6b6b}.status-due{background:rgba(34,197,94,0.2);color:#22c55e}.btn{padding:12px 20px;border:none;border-radius:8px;cursor:pointer;font-weight:600;margin:10px 0;width:100%}.btn-success{background:#22c55e;color:white}.btn-success:hover{background:#16a34a}.btn-primary{background:#3b82f6;color:white}.btn-primary:hover{background:#2563eb}.chart-container{position:relative;height:250px;margin-top:15px}.empty-state{text-align:center;padding:30px;color:#a0aec0}.loading{text-align:center;padding:40px}.spinner{display:inline-block;width:20px;height:20px;border:3px solid #2a3f5f;border-top:3px solid #4fa3ff;border-radius:50%;animation:spin 1s linear infinite;margin-right:10px}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}<\/style><\/head><body><div class="container"><h1 id="welcomeText">Welcome!</h1><p class="welcome" id="dateText">Real Estate Call CRM<\/p><div class="stats-grid"><div class="stat-card"><div class="stat-label">Calls Today<\/div><div class="stat-value" id="callsToday">0<\/div><div class="stat-sub" id="callsSub">Total<\/div><\/div><div class="stat-card"><div class="stat-label">Due Today<\/div><div class="stat-value" id="dueToday">0<\/div><div class="stat-sub" id="overdueSub">Overdue<\/div><\/div><div class="stat-card"><div class="stat-label">Pipeline<\/div><div class="stat-value" id="pipeline">0<\/div><div class="stat-sub">Properties<\/div><\/div><\/div><div class="grid-2"><div class="card"><h2>Today's Follow-ups<\/h2><div id="followupsContent" class="table-wrapper"><div class="loading"><span class="spinner"><\/span>Loading...<\/div><\/div><\/div><div class="card"><h2>Recent Calls<\/h2><div id="recentContent" class="table-wrapper"><div class="loading"><span class="spinner"><\/span>Loading...<\/div><\/div><\/div><\/div><div class="grid-2"><div class="card"><h2>Weekly Volume<\/h2><div class="chart-container"><canvas id="volumeChart"><\/canvas><\/div><\/div><div class="card"><h2>Interactions<\/h2><div class="chart-container"><canvas id="interactionChart"><\/canvas><\/div><\/div><\/div><div class="card"><h2>Actions<\/h2><button class="btn btn-success" onclick="openLogCall()">☎️ Log Call<\/button><\/div><\/div><script>const dashboardData = ${dataJson};let volumeChart=null;let interactionChart=null;function openLogCall(){google.script.run.openTomCallLogDialog()}function formatDate(dateStr){if(!dateStr)return'-';const parts=dateStr.split('/');if(parts.length===3){const date=new Date(parts[2],parts[0]-1,parts[1]);return date.toLocaleDateString('en-US',{month:'short',day:'numeric'})}return dateStr}function getBadgeClass(type){if(!type)return'';const lower=type.toLowerCase();if(lower==='spoke with')return'badge-spoke';if(lower==='voicemail')return'badge-voicemail';if(lower==='no answer')return'badge-noanswer';if(lower==='wrong number')return'badge-wrongnumber';return''}function setWelcome(){const today=new Date();const dateStr=today.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});document.getElementById('welcomeText').textContent='WELCOME, TOM!';document.getElementById('dateText').textContent='Today is '+dateStr}function displayFollowups(data){const container=document.getElementById('followupsContent');if(!data||data.length===0){container.innerHTML='<div class="empty-state">✅ No follow-ups due today!<\/div>';return}let html='<table><thead><tr><th>Property<\/th><th>Interaction<\/th><th>Due Date<\/th><th>Status<\/th><\/tr><\/thead><tbody>';data.slice(0,5).forEach(f=>{const status=f.daysOverdue>0?'status-overdue':'status-due';const text=f.daysOverdue>0?'Overdue':'Due Today';html+='<tr><td><strong>'+(f.property||'-')+'<\/strong><\/td><td>'+(f.interaction||'-')+'<\/td><td>'+formatDate(f.followupDate)+'<\/td><td><span class="badge '+status+'">'+text+'<\/span><\/td><\/tr>'});html+='<\/tbody><\/table>';container.innerHTML=html}function displayRecent(data){const container=document.getElementById('recentContent');if(!data||data.length===0){container.innerHTML='<div class="empty-state">No calls logged yet<\/div>';return}let html='<table><thead><tr><th>Date<\/th><th>Property<\/th><th>Type<\/th><\/tr><\/thead><tbody>';data.slice(0,5).forEach(c=>{const badge=getBadgeClass(c.interactionType);html+='<tr><td>'+formatDate(c.date)+'<\/td><td>'+(c.property||'-')+'<\/td><td><span class="badge '+badge+'">'+(c.interactionType||'-')+'<\/span><\/td><\/tr>'});html+='<\/tbody><\/table>';container.innerHTML=html}function updateVolume(data){const ctx=document.getElementById('volumeChart');if(!data||Object.keys(data).length===0){ctx.parentElement.innerHTML='<div class="empty-state">No data<\/div>';return}const keys=Object.keys(data);const vals=keys.map(k=>data[k]);if(volumeChart)volumeChart.destroy();volumeChart=new Chart(ctx,{type:'bar',data:{labels:keys,datasets:[{label:'Calls',data:vals,backgroundColor:'#3b82f6'}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#a0aec0'},grid:{color:'#2a3f5f'}},y:{ticks:{color:'#a0aec0'}}}}})}function updateInteraction(data){const ctx=document.getElementById('interactionChart');if(!data||Object.keys(data).length===0){ctx.parentElement.innerHTML='<div class="empty-state">No data<\/div>';return}const keys=Object.keys(data);const vals=keys.map(k=>data[k]);const colors={'Spoke With':'#34A853','Voicemail':'#FBBC04','No Answer':'#EA4335','Wrong Number':'#9AA0A6'};const bgColors=keys.map(k=>colors[k]||'#999');if(interactionChart)interactionChart.destroy();interactionChart=new Chart(ctx,{type:'doughnut',data:{labels:keys,datasets:[{data:vals,backgroundColor:bgColors,borderColor:'#1e2d42',borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#a0aec0'}}}}})}function displayDashboard(){setWelcome();document.getElementById('callsToday').textContent=dashboardData.totalCalls||0;document.getElementById('dueToday').textContent=dashboardData.dueTodayCount||0;document.getElementById('overdueSub').textContent=(dashboardData.overdueCount||0)+' overdue';document.getElementById('pipeline').textContent=dashboardData.prospectCount||0;displayFollowups(dashboardData.todaysFollowups||[]);displayRecent(dashboardData.recentCalls||[]);updateVolume(dashboardData.weeklyVolume||{});updateInteraction(dashboardData.interactionBreakdown||{})}displayDashboard()<\/script><\/body><\/html>`;

  const html = HtmlService.createHtmlOutput(htmlString)
    .setWidth(1400)
    .setHeight(1000);
  SpreadsheetApp.getUi().showModalDialog(html, 'Command Center Dashboard');
}

function getDashboardData() {
  try {
    // Supabase credentials
    const SUPABASE_URL = "https://blhxgcncijmxxhleqmri.supabase.co";
    const SUPABASE_API_KEY = "sb_publishable_T9uXncJJ9m-4fV7xDLzWPA_enkmnDHi";

    Logger.log("=== getDashboardData (Supabase) started ===");

    let totalCalls = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;
    let thisWeekCount = 0;
    let todaysFollowups = [];
    let recentCalls = [];
    let weeklyVolume = {};
    let interactionBreakdown = {};
    let prospectCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - today.getDay());

    // Initialize weekly volume
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dayStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      weeklyVolume[dayStr] = 0;
    }

    // Fetch properties count
    const propertiesResponse = fetchSupabaseData(SUPABASE_URL, SUPABASE_API_KEY, "properties");
    if (propertiesResponse && propertiesResponse.length) {
      prospectCount = propertiesResponse.length;
    }

    // Fetch calls data
    const callsResponse = fetchSupabaseData(SUPABASE_URL, SUPABASE_API_KEY, "calls");
    if (!callsResponse) {
      throw new Error("Failed to fetch calls data");
    }

    Logger.log("Fetched " + callsResponse.length + " calls from Supabase");

    // Process calls data
    for (let i = 0; i < callsResponse.length; i++) {
      const call = callsResponse[i];
      const dateStr = call.date_called;
      const property_name = call.property_id || 'Unknown';
      const interactionType = call.interaction_type || 'Unknown';
      const spokeWith = call.spoke_with || 'N/A';
      const nextFollowupStr = call.next_followup_date;

      if (!dateStr) continue;

      const callDate = new Date(dateStr);
      const nextFollowupDate = nextFollowupStr ? new Date(nextFollowupStr) : null;

      // Count calls made today only
      if (callDate && callDate.toDateString() === today.toDateString()) {
        totalCalls++;
      }

      if (interactionType) {
        interactionBreakdown[interactionType] = (interactionBreakdown[interactionType] || 0) + 1;
      }

      if (callDate && callDate >= sevenDaysAgo && callDate <= today) {
        const dayStr = callDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (weeklyVolume[dayStr] !== undefined) {
          weeklyVolume[dayStr]++;
        }
      }

      if (nextFollowupDate) {
        if (nextFollowupDate <= today) {
          dueTodayCount++;
          const daysOverdue = Math.floor((today - nextFollowupDate) / (1000 * 60 * 60 * 24));
          todaysFollowups.push({
            property: property_name,
            address: call.property_id,
            interaction: interactionType,
            followupDate: formatDateForDisplay(nextFollowupDate),
            daysOverdue: daysOverdue
          });

          if (daysOverdue > 0) {
            overdueCount++;
          }
        } else if (nextFollowupDate >= weekStart && nextFollowupDate <= today) {
          thisWeekCount++;
        }
      }

      if (callDate && callDate >= sevenDaysAgo && callDate <= today) {
        recentCalls.push({
          date: formatDateForDisplay(callDate),
          property: property_name,
          address: call.property_id,
          interactionType: interactionType,
          spokeWith: spokeWith,
          agent: 'Agent',
          nextFollowupDate: nextFollowupStr
        });
      }
    }

    recentCalls.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

    recentCalls = recentCalls.slice(0, 10);

    Logger.log("=== Dashboard Data Summary ===");
    Logger.log("Total Calls Today: " + totalCalls);
    Logger.log("Due Today: " + dueTodayCount);
    Logger.log("Overdue: " + overdueCount);
    Logger.log("Property Count: " + prospectCount);
    Logger.log("Today's Followups: " + todaysFollowups.length);
    Logger.log("Recent Calls: " + recentCalls.length);

    return {
      totalCalls: totalCalls,
      dueTodayCount: dueTodayCount,
      overdueCount: overdueCount,
      thisWeekCount: thisWeekCount,
      todaysFollowups: todaysFollowups,
      recentCalls: recentCalls,
      weeklyVolume: weeklyVolume,
      interactionBreakdown: interactionBreakdown,
      prospectCount: prospectCount,
      propertiesNoContact: 0
    };
  } catch(error) {
    Logger.log("ERROR in getDashboardData: " + error.toString());
    Logger.log("Stack: " + error.stack);
    return {
      totalCalls: 0,
      dueTodayCount: 0,
      overdueCount: 0,
      thisWeekCount: 0,
      todaysFollowups: [],
      recentCalls: [],
      weeklyVolume: {},
      interactionBreakdown: {},
      prospectCount: 0,
      propertiesNoContact: 0,
      error: error.toString()
    };
  }
}

function fetchSupabaseData(url, apiKey, table) {
  try {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url + '/rest/v1/' + table, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      Logger.log("Supabase fetch error for table " + table + ": " + responseCode);
      Logger.log("Response: " + response.getContentText());
      return null;
    }

    const data = JSON.parse(response.getContentText());
    return data;
  } catch(e) {
    Logger.log("Error fetching " + table + " from Supabase: " + e.toString());
    return null;
  }
}

function formatDateForDisplay(date) {
  if (!date) return '-';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
}

function parseGoogleSheetDate(dateStr) {
  if (!dateStr) return null;

  if (dateStr instanceof Date) {
    if (!isNaN(dateStr.getTime())) {
      return dateStr;
    }
  }

  const dateString = dateStr.toString();

  const parts = dateString.split('/');
  if (parts.length === 3) {
    const date = new Date(parts[2], parts[0] - 1, parts[1]);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

function formatDateForSheet(date) {
  if (!date) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return month + '/' + day + '/' + year;
}

// Add Property IDs to Prospects sheet (Column F)
function addPropertyIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prospectSheet = ss.getSheetByName('Prospects');

  if (!prospectSheet) {
    SpreadsheetApp.getUi().alert('Prospects sheet not found!');
    return;
  }

  const propertyIdCol = 6; // Column F
  const lastRow = prospectSheet.getLastRow();

  // Add header if not present
  if (!prospectSheet.getRange(1, propertyIdCol).getValue()) {
    prospectSheet.getRange(1, propertyIdCol).setValue('Property ID');
  }

  // Fill in IDs
  let idsAdded = 0;
  for (let row = 2; row <= lastRow; row++) {
    if (!prospectSheet.getRange(row, propertyIdCol).getValue()) {
      const propertyId = 'P' + String(row - 1).padStart(4, '0');
      prospectSheet.getRange(row, propertyIdCol).setValue(propertyId);
      idsAdded++;
    }
  }

  SpreadsheetApp.getUi().alert('Added ' + idsAdded + ' Property IDs to Column F!');
}

// =====================================================
// EMAIL FUNCTIONS - Gmail Integration
// =====================================================

function sendEmailViaGmail(recipientEmail, recipientName, subject, body) {
  try {
    // Get the active user's email
    const userEmail = Session.getActiveUser().getEmail();

    // Replace {name} placeholder in body with recipient name
    const personalizedBody = body.replace(/{name}/g, recipientName);

    // Send email using Gmail API
    GmailApp.sendEmail(recipientEmail, subject, personalizedBody, {
      from: userEmail,
      name: 'CRM System'
    });

    Logger.log("Email sent successfully to: " + recipientEmail);
    return true;

  } catch (error) {
    Logger.log("Error sending email: " + error.toString());
    throw new Error("Failed to send email: " + error.toString());
  }
}

// TEST FUNCTION - Run this to see what's happening
function testGetDashboardData() {
  Logger.log("=== TESTING GET DASHBOARD DATA ===");
  const data = getDashboardData();
  Logger.log("Result is null? " + (data === null));
  Logger.log("Result is undefined? " + (data === undefined));
  Logger.log("Full result: " + JSON.stringify(data));
}
