# puzzle-extraction-api

* Node.js API endpoint for https://tools.qhex Puzzlehunt extraction tool.
* Auto-run extraction service on Google spreadsheets by providing spreadsheet ID and (optionally) desired cell range.
* Robust to spreadsheets with messy scratch work/missing data/empty cells -- will infer the subset of cell ranges that contain relevant data.

## Development
* `npm install -g yarn` if you do not already have it.
* `cd server; yarn;` to install dependencies.
* `npm start` -- the first time running, you will be prompted to authenticate with Google to generate a token that grants this service access to your Google spreadsheets.


## API Spec

* `GET /api/extraction?spreadsheetId={spreadsheetId}&range={range}`

OR

* `POST /api/extraction` -- `req.body -> {"spreadsheetId": ..., "range": ...}`

* `spreadsheetId`: ID of any Google Drive spreadsheet that you have view access to e.g. `spreadsheetId=1lK-4Kbj07QbbGfNAA7sLGIuBc-L0PgMJW_bRde1b1U0`
* Use `range` parameter to specify where the relevant data is:
  - `range=Sheet1` performs extraction over all data in default "Sheet1" tab
  - `range=Main!D5:M13` performs extraction only on contents of the "Main" tab rows D-M, columns 5-13.

### Example

Consider this puzzle from [Mystery Hunt 2019 ("Split Seven Ways")](http://web.mit.edu/puzzle/www/2019/puzzle/split_seven_ways.html)

Spreadsheet of collected data (adopted from a real team's scratch work):
https://docs.google.com/spreadsheets/d/1lK-4Kbj07QbbGfNAA7sLGIuBc-L0PgMJW_bRde1b1U0
 
 **The final extraction is unknown.**

**Query**: `GET /api/extraction?spreadsheetId=1lK-4Kbj07QbbGfNAA7sLGIuBc-L0PgMJW_bRde1b1U0&range=Main`

**Response**:

`results`: List of solution guesses and corresponding extraction mechanism, ordered by confidence level.

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
