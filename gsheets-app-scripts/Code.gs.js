var API_BASE_URL = "https://runpengliu.com:8080/api";
var MONOSPACE_FONT = "Roboto Mono";

function onOpen() {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Puzzlehunt Extraction')
        .addItem('Clean selected range for extraction', 'cleanForExtraction')
        .addItem('Guess extraction from selected range', 'doQHexExtraction')
        .addToUi();
}

function onInstall(e) {
    onOpen(e);
}

var EXTRACTION_RESULT_SHEET_NAME = "[GENERATED] Extraction Guess Results";
var EXTRACTION_CLEANED_SHEET_NAME = "[GENERATED] Cleaned for Extraction";

function cleanForExtraction() {
    const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const spreadsheetId = activeSpreadsheet.getId();
    const activeSheetName = activeSpreadsheet.getActiveSheet().getName();
    const activeRange = activeSpreadsheet.getActiveSheet().getActiveRange().getA1Notation();
    const rangeString = activeSheetName + "!" + activeRange;
    const fetchUrl = API_BASE_URL + "/clean?spreadsheetId={spreadsheetId}&range={range}"
        .replace("{range}", rangeString)
        .replace("{spreadsheetId}", spreadsheetId);
    console.log("Executing request: GET " + fetchUrl);
    var response = UrlFetchApp.fetch(fetchUrl);
    try {
        var jsonResponse = JSON.parse(response.getContentText());
        console.log("Response: ", JSON.stringify(jsonResponse));
        var sheet = activeSpreadsheet.getSheetByName(EXTRACTION_CLEANED_SHEET_NAME);
        if (!sheet) {
            sheet = activeSpreadsheet.insertSheet(EXTRACTION_CLEANED_SHEET_NAME);
        }
        if (jsonResponse.standardizedContents.json) {
            const rows = jsonResponse.standardizedContents.json;

            var range = sheet.getRange(2, 1, rows.length, rows[0].length);
            range.setValues(rows);
            range.setFontFamily(MONOSPACE_FONT);
            rows[0].forEach(function(v, i) {
                const col = i + 1;
                if (v.length <= 25) {
                    sheet.autoResizeColumn(col);
                } else {
                    sheet.getRange(2, col, rows.length).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
                }
            });

            var headerRange = sheet.getRange(1, 1, 1, rows[0].length);
            headerRange.setValues([rows[0].map(function(v, i) { return "C" + (i + 1).toString(); })]);
            headerRange.setBackground("#cccccc");
            headerRange.setFontFamily(MONOSPACE_FONT);
            headerRange.setFontWeight("bold");
            headerRange.setHorizontalAlignment("center")
            sheet.setFrozenRows(1);
            
            sheet.activate();
            range.activate();
            return { spreadsheetId: spreadsheetId, sheet: sheet, range: range };
        } else {
            sheet.getRange(2, 1).setValue("An unexpected error occurred :(");
            return null;
        }
    } catch (e) {
        console.error("Error: " + e);
        return null;
    }
}

function doQHexExtraction() {
    const result = cleanForExtraction();
    SpreadsheetApp.flush();
    if (result) {
        guessExtraction(result);
    }
}

function guessExtraction(result) {
    const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const fetchUrl = API_BASE_URL + "/extraction?spreadsheetId={spreadsheetId}&range={range}"
        .replace("{range}", encodeURIComponent(result.sheet.getName() + "!" + result.range.getA1Notation()))
        .replace("{spreadsheetId}", result.spreadsheetId);
    console.log("Executing request: GET " + fetchUrl);
    var response = UrlFetchApp.fetch(fetchUrl);
    try {
        var jsonResponse = JSON.parse(response.getContentText());
        console.log("Response: ", JSON.stringify(jsonResponse));
        var sheet = activeSpreadsheet.getSheetByName(EXTRACTION_RESULT_SHEET_NAME);
        if (!sheet) {
            sheet = activeSpreadsheet.insertSheet(EXTRACTION_RESULT_SHEET_NAME);
        }
        sheet.activate();
        var range = sheet.getRange(1, 1, 1, 2);
        range.setValues([
            ["Guess", "Extraction"]
        ]);
        range.setFontWeight("bold");
        if (jsonResponse.results.length) {
            var range = sheet.getRange(2, 1, jsonResponse.results.length, 2);
            range.setValues(jsonResponse.results.map(function(result) {
                return [result.guess, result.extraction]
            }));
            range.setFontFamily(MONOSPACE_FONT);
        } else {
            sheet.getRange(2, 1).setValue("No results :(");
        }
        sheet.autoResizeColumn(1);
    } catch (e) {
        console.error("Error: " + e);
    }
}
