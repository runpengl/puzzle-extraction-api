# puzzle-extraction-api

* Node.js API endpoint for https://tools.qhex Puzzlehunt extraction tool, which takes a table of information and attempts to extract an answer by indexing into it in various ways. Values can be comma or tab-separated, and a question mark may be used as a wildcard for unknown values.
* Auto-run the extraction service on Google spreadsheets by querying the API with spreadsheet ID and (optionally) desired cell range.
* Robust against spreadsheets with messy scratch work/missing data/empty cells -- will infer the subset of cells that contain relevant information.
* Google Sheets add-on integration: attach `gsheets-app-scripts/Code.gs` to your team's puzzlehunt spreadsheet template to have the tool available in the Sheets toolbar.

## Development
* `npm install -g yarn` if you do not already have it.
* `cd server; yarn;` to install dependencies.
* `npm start` -- the first time running, you will be prompted to authenticate with Google to generate a token that grants this service access to your Google spreadsheets.

## API Spec

`GET /api/extraction?spreadsheetId={spreadsheetId}&range={range}`

OR

`POST /api/extraction` with JSON payload `{"spreadsheetId": ..., "range": ...}`

* `spreadsheetId`: ID of any Google Drive spreadsheet that you have view access to e.g. `spreadsheetId=1lK-4Kbj07QbbGfNAA7sLGIuBc-L0PgMJW_bRde1b1U0`
* Use `range` parameter to specify where the relevant data is:
  - `range=Sheet1` performs extraction over all data in default **"Sheet1"** tab
  - `range=Main!D5:M13` performs extraction only on contents of the **"Main"** tab: Rows **D-M**, Columns **5-13**.

`GET /api/extraction?contents={contents}`
* Pass in spreadsheet contents as URI-encoded raw string (CSV or TSV format).

## Google Sheets Add-on

**1.** Highlight range of relevant data, and choose **Puzzlehunt Extraction > Guess extraction from selected range** in the Sheets toolbar.
![Screenshot 1](/attachments/screenshot_1.png)

**2.** Two additional tabs are auto-generated for you: 
- a _cleaned_ version of the relevant dataset, with empty columns/rows deleted, non-alphanumeric characters stripped and converted to uppercase. Relevant headers are re-labelled and frozen.
- a list of guesses with the corresponding extraction mechanism, ordered by confidence.
![Screenshot 3](/attachments/screenshot_3.png)

## Examples

### [SIMPLE] Raw text example

[Witness 2 META puzzle [Mystery Hunt 2008]](http://www.mit.edu/~puzzle/2008/lbb_metas/witness2.shtml)

Data:
```
GPARTELID
IELDGPTAR
DRTLIAPGE
EGDPLRATI
ATPIEDRLG
RLIGATDEP
TIRAPGEDL
PAGEDLIRT
LDETRIGPA
```
**Desired extraction**: Read the diagonals to get "GET PETER A LARGER PAD".

**Query**: `GET /api/extraction?contents=GPARTELID%0AIELDGPTAR%0ADRTLIAPGE%0AEGDPLRATI%0AATPIEDRLG%0ARLIGATDEP%0ATIRAPGEDL%0APAGEDLIRT%0ALDETRIGPA`

**Response**:

`results`: List of solution guesses and corresponding extraction mechanism, ordered by confidence level.

```javascript
{ "results": [
    {
      "guess": "LARGER PAD",
      "extraction": "INDEX(C1, -I) SORTED BY -I"
    },
    {
      "guess": "GET PETERA",
      "extraction": "INDEX(C1, I) SORTED BY I"
    },
    {
      "guess": "LATER GIDP",
      "extraction": "INDEX(C1, 2) SORTED BY INDEX(C1, 5)"
    },
    {
      "guess": "GLID PRATE",
      "extraction": "INDEX(C1, 8) SORTED BY INDEX(C1, 6)"
    },
    {
      "guess": "ARETE P TEG",
      "extraction": "INDEX(C1, I) SORTED BY -I"
    },
    ...
  ]
}
```

### [EASY] Clean Spreadsheet example
["Believe" [Mystery Hunt 2016]](http://web.mit.edu/puzzle/www/2016/puzzle/believe/solution)

Spreadsheet of collected data:
https://docs.google.com/spreadsheets/d/190jACFVsefeRxc5xd8fE29rZ5Gs_Q4NFOJ8mhis6HiQ

**Desired extraction:** Index into name of the eliminated speller by the score earned in order of elimination gives the message "BERNADETTE MIAO'S ROUND TWO WORD"

**Query**: `GET /api/extraction?spreadsheetId=190jACFVsefeRxc5xd8fE29rZ5Gs_Q4NFOJ8mhis6HiQ&range=Sheet1` (allow ~20 seconds processing time)

**Response**:
```javascript
{ "results": [
    {
      "guess": "BERNADETTE MI AOS ROUND TWO WORD",
      "extraction": "INDEX(C2, INT(C5)) SORTED BY I"
    },
    {
      "guess": "PILT ACDA LQT TATU TOLAN CT SHOTE",
      "extraction": "INDEX(C4, 5) SORTED BY C2 REVERSED"
    },
    {
      "guess": "RHN EHREE OOM YEA LATHE KRC EAVES",
      "extraction": "INDEX(C2, 7) SORTED BY (C5,C2) REVERSED"
    },
    {
      "guess": "WO WORDS ROUND TTTE MIAO BERNA DE",
      "extraction": "INDEX(C2, INT(C5)) SORTED BY (C1,-I) REVERSED"
    },
    ...
   ]
}
```

### [HARD] "Messy" Spreadsheet example
["Split Seven Ways" [Mystery Hunt 2019]](http://web.mit.edu/puzzle/www/2019/solution/split_seven_ways.html)

Spreadsheet of collected data (adopted from a real team's scratch work):
https://docs.google.com/spreadsheets/d/1lK-4Kbj07QbbGfNAA7sLGIuBc-L0PgMJW_bRde1b1U0
 
 **The final extraction is unknown.**

**Query**: `GET /api/extraction?spreadsheetId=1lK-4Kbj07QbbGfNAA7sLGIuBc-L0PgMJW_bRde1b1U0&range=Main`
(allow ~30 seconds processing time)

**Response**:

`standardizedContents.csv`: The subset of spreadsheet data used in the extraction. Whitespace and special characters are stripped, all text content is converted to uppercase.

`standardizedContents.json`: The same data in `standardizedContents.csv` converted to a 2D-array.

```javascript
{
  "results": [
    {
      "guess": "GHOUL SLEEPWEAR",
      "extraction": "INDEX(C9, INT(C5)) SORTED BY I"
    },
    {
      "guess": "MARVEN BARBAL RA",
      "extraction": "INDEX(C8, 3) SORTED BY (C4,C9)"
    },
    {
      "guess": "ARAL FTO ROULEAU",
      "extraction": "INDEX(C2, 9) SORTED BY (C8,C2) REVERSED"
    },
    {
      "guess": "LOWN ERS ANODE AR",
      "extraction": "INDEX(C2, 16) SORTED BY (C5,I)"
    },
    ...
  ],
  "standardizedContents": {
    "csv": "CZECH,IDREAMEDAGIANTCALLEDHAGRIDCAMETOTELLMEIWASGOINGTOASCHOOLFORWIZARDS,1,5,4,,SORCERERSSTONE,RUBEUSHAGRID,DIAGONALLEY\nCZECH,MALFOYCOULDNTBELIEVEHISEYESWHENHESAWTHATHARRYANDRONWERESTILLATHOGWARTSNEXTDAYLOOKINGTIREDBUTPERFECTLYCHEERFUL,1,10,1,,SORCERERSSTONE,DRACOMALFOY,HALLOWEEN\nFINNISH,THELITTLECREATUREONTHEBEDHADLARGEBATLIKEEARSANDBULGINGGREENEYESTHESIZEOFTENNISBALLS,2,2,2,,CHAMBEROFSECRETS,DOBBY,DOBBYSWARNING\nFINNISH,HARDERTOAVOIDWASCOLINCREEVEYWHOSEEMEDTOHAVEMEMORIZEDHARRYSSCHEDULE,2,7,2,,CHAMBEROFSECRETS,COLINCREEVY,MUDBLOODSANDMURMURS\nGREEK,ONLYDRACOMALFOYANDHISGANGOFSLYTHERINSHADANYTHINGBADTOSAYABOUTPROFESSORLUPIN,3,8,2,,PRISONEROFAZKABAN,DRACOMALFOY,FLIGHTOFTHEFATLADY\nGREEK,NOONEINGRYFFINDORTOWERSLEPTTHATNIGHT,3,14,1,,PRISONEROFAZKABAN,SEVERUSSNAPE,SNAPESGRUDGE\nINDONESIAN,THEMAIDHADRUNSCREAMINGDOWNTHEHILLINTOTHEVILLAGEANDROUSEDASMANYPEOPLEASSHECOULD,4,1,8,,GOBLETOFFIRE,TOMRIDDLE,THERIDDLEHOUSE\nINDONESIAN,HEGOTUPDRESSEDINTHEPALEDAWNLIGHTLEFTTHEDORMITORYWITHOUTWAKINGRONANDWENTBACKDOWNTOTHEDESERTEDCOMMONROOM,4,15,2,,GOBLETOFFIRE,FLEURDELACOUR,BEAUXBATONSANDDURMSTRANG\nJAPANESE,FORAFEWMOMENTSHELAYIMMOBILE,5,7,3,,ORDEROFTHEPHOENIX,HARRYPOTTER,THEMINISTRYOFMAGIC\nJAPANESE,HARRYWASFIRSTTOWAKEUPINHISDORMITORYNEXTMORNING,5,14,1,,ORDEROFTHEPHOENIX,PERCYWEASLEY,PERCYANDPADFOOT\nRUSSIAN,HARRYPOTTERWASSNORINGLOUDLY,6,3,1,,HALFBLOODPRINCE,HARRYPOTTER,WILLANDWONT\nRUSSIAN,SOALLINALLNOTONEOFRONSBETTERBIRTHDAYSSAIDFRED,6,19,1,,HALFBLOODPRINCE,RONWEASLEY,ELFTAILS\nSWEDISH,HARRYSTRUGGLEDTORAISEHIMSELFOUTOFTHEDEBRISOFMETALANDLEATHERTHATSURROUNDEDHIM,7,5,2,,DEATHLYHALLOWS,ALASTORMOODY,FALLENWARRIOR\nSWEDISH,INTHESMALLESTBEDROOMASINGLELONGCOARSEBLACKHAIRPLUCKEDFROMTHESWEATERHERMIONEHADBEENWEARINGATMALFOYMANORLAYCURLEDINASMALLGLASSPHIALONTHEMANTELPIECE,7,26,2,,DEATHLYHALLOWS,DRACOMALFOY,GRINGOTTS\n",
    "json": [
      [
        "CZECH",
        "IDREAMEDAGIANTCALLEDHAGRIDCAMETOTELLMEIWASGOINGTOASCHOOLFORWIZARDS",
        "1",
        "5",
        "4",
        "",
        "SORCERERSSTONE",
        "RUBEUSHAGRID",
        "DIAGONALLEY"
      ],
      [
        "CZECH",
        "MALFOYCOULDNTBELIEVEHISEYESWHENHESAWTHATHARRYANDRONWERESTILLATHOGWARTSNEXTDAYLOOKINGTIREDBUTPERFECTLYCHEERFUL",
        "1",
        "10",
        "1",
        "",
        "SORCERERSSTONE",
        "DRACOMALFOY",
        "HALLOWEEN"
      ],
      [
        "FINNISH",
        "THELITTLECREATUREONTHEBEDHADLARGEBATLIKEEARSANDBULGINGGREENEYESTHESIZEOFTENNISBALLS",
        "2",
        "2",
        "2",
        "",
        "CHAMBEROFSECRETS",
        "DOBBY",
        "DOBBYSWARNING"
      ],
      [
        "FINNISH",
        "HARDERTOAVOIDWASCOLINCREEVEYWHOSEEMEDTOHAVEMEMORIZEDHARRYSSCHEDULE",
        "2",
        "7",
        "2",
        "",
        "CHAMBEROFSECRETS",
        "COLINCREEVY",
        "MUDBLOODSANDMURMURS"
      ],
      [
        "GREEK",
        "ONLYDRACOMALFOYANDHISGANGOFSLYTHERINSHADANYTHINGBADTOSAYABOUTPROFESSORLUPIN",
        "3",
        "8",
        "2",
        "",
        "PRISONEROFAZKABAN",
        "DRACOMALFOY",
        "FLIGHTOFTHEFATLADY"
      ],
      [
        "GREEK",
        "NOONEINGRYFFINDORTOWERSLEPTTHATNIGHT",
        "3",
        "14",
        "1",
        "",
        "PRISONEROFAZKABAN",
        "SEVERUSSNAPE",
        "SNAPESGRUDGE"
      ],
      [
        "INDONESIAN",
        "THEMAIDHADRUNSCREAMINGDOWNTHEHILLINTOTHEVILLAGEANDROUSEDASMANYPEOPLEASSHECOULD",
        "4",
        "1",
        "8",
        "",
        "GOBLETOFFIRE",
        "TOMRIDDLE",
        "THERIDDLEHOUSE"
      ],
      [
        "INDONESIAN",
        "HEGOTUPDRESSEDINTHEPALEDAWNLIGHTLEFTTHEDORMITORYWITHOUTWAKINGRONANDWENTBACKDOWNTOTHEDESERTEDCOMMONROOM",
        "4",
        "15",
        "2",
        "",
        "GOBLETOFFIRE",
        "FLEURDELACOUR",
        "BEAUXBATONSANDDURMSTRANG"
      ],
      [
        "JAPANESE",
        "FORAFEWMOMENTSHELAYIMMOBILE",
        "5",
        "7",
        "3",
        "",
        "ORDEROFTHEPHOENIX",
        "HARRYPOTTER",
        "THEMINISTRYOFMAGIC"
      ],
      [
        "JAPANESE",
        "HARRYWASFIRSTTOWAKEUPINHISDORMITORYNEXTMORNING",
        "5",
        "14",
        "1",
        "",
        "ORDEROFTHEPHOENIX",
        "PERCYWEASLEY",
        "PERCYANDPADFOOT"
      ],
      [
        "RUSSIAN",
        "HARRYPOTTERWASSNORINGLOUDLY",
        "6",
        "3",
        "1",
        "",
        "HALFBLOODPRINCE",
        "HARRYPOTTER",
        "WILLANDWONT"
      ],
      [
        "RUSSIAN",
        "SOALLINALLNOTONEOFRONSBETTERBIRTHDAYSSAIDFRED",
        "6",
        "19",
        "1",
        "",
        "HALFBLOODPRINCE",
        "RONWEASLEY",
        "ELFTAILS"
      ],
      [
        "SWEDISH",
        "HARRYSTRUGGLEDTORAISEHIMSELFOUTOFTHEDEBRISOFMETALANDLEATHERTHATSURROUNDEDHIM",
        "7",
        "5",
        "2",
        "",
        "DEATHLYHALLOWS",
        "ALASTORMOODY",
        "FALLENWARRIOR"
      ],
      [
        "SWEDISH",
        "INTHESMALLESTBEDROOMASINGLELONGCOARSEBLACKHAIRPLUCKEDFROMTHESWEATERHERMIONEHADBEENWEARINGATMALFOYMANORLAYCURLEDINASMALLGLASSPHIALONTHEMANTELPIECE",
        "7",
        "26",
        "2",
        "",
        "DEATHLYHALLOWS",
        "DRACOMALFOY",
        "GRINGOTTS"
      ]
    ]
  }
}
`
