const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const utils = require('../utils');
//const AWS = require("aws-sdk"),
//const awsConfig = require("../config/aws-config")

/*AWS.config.update({
    region: 'us-east-1',
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey
});
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });*/

const qhex = require("../controllers/qhex");
const gsheets = require("../controllers/gsheets");

const UPDATE_PERIOD = 1500;

const errorHandler = (res, statusCode) => {
    return (err) => {
        res.status(statusCode || 500).send(err);
    }
}

const parseRowsToCSV = (rows) => {
    return rows.map((row) => {
        const cleanCells = row.map((cell) => {
            const cleaned = cell.replace(/[^\w]/gi, "");
            return cleaned.length ? cleaned : "?";
        });
        return cleanCells.join(",").toUpperCase();
    }).join("\n") + "\n";
}

const parseCSVtoJSON = (csv) => {
    return csv.split("\n")
        .map((row) => {
            return row.split(",");
        });
}

const parseTextToRows = (raw) => {
    let rows = raw.split("\n")
        .filter((row) => {
            return row.trim().length;
        });
    rows = rows.map((row) => {
        return row.split("\t");
    });
}

function getUpdateQuery(token, _resultsCallback, _finishedCallback) {
    return () => {
        qhex.queryUpdate({ token: token })
            .then((data) => {
                if (data.finished) {
                    _finishedCallback(data);
                } else {
                    _resultsCallback(data);
                }
            }).catch(_finishedCallback);
    }
}

function executeExtraction(res, params) {
    let accumulatedResults = [];
    qhex.queryExtraction(params)
        .then((token) => {
            const finishedCallback = (data) => {
                if (data && data.results) {
                    accumulatedResults = accumulatedResults.concat(data.results);
                }
                res.json({
                    results: accumulatedResults,
                    standardizedContents: {
                        csv: params.contents,
                        json: parseCSVtoJSON(params.contents)
                    }
                });
            };
            let resultsCallback = (data) => {
                if (data && data.results) {
                    accumulatedResults = accumulatedResults.concat(data.results);
                }
                setTimeout(getUpdateQuery(token, resultsCallback, finishedCallback), UPDATE_PERIOD);
            };
            resultsCallback();
        })
        .catch(errorHandler(res, 400));
}

function handleExtraction(req, res) {
    Object.keys(req.query).forEach((key) => {
        req.query[key] = decodeURIComponent(req.query[key]);
    });
    if (req.body) {
        Object.keys(req.body).forEach((key) => {
            req.query[key] = req.body[key];
        });
    }
    if (req.query.spreadsheetId) {
        gsheets.fetchContents(req.query)
            .then((rows) => {
                const csvContents = parseRowsToCSV(rows);
                executeExtraction(res, { contents: csvContents })
            })
            .catch(errorHandler(res));
    } else {
        let rows = parseTextToRows(req.query.contents);
        let columns = utils.unique(utils.stripEmpty(utils.transverse(rows)));
        rows = utils.transverse(columns);
        const csvContents = parseRowsToCSV(rows);
        executeExtraction(res, { contents: csvContents });
    }
}

// GET /api/extraction?spreadsheetId={}&range={}
router.get("/extraction", handleExtraction);

// POST /api/extraction 
// req.body => {"spreadsheetId": "...", "range": "..."}
router.post("/extraction", handleExtraction);

module.exports = router;