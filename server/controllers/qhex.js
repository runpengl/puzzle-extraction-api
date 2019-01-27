const request = require("request");

const BASE_URL = "https://tools.qhex.org/q?";

exports.queryExtraction = (params) => {
    return new Promise((resolve, reject) => {
        if (!params.contents) return reject("No sheet contents found.");
        console.log("[Extraction] query:\n======\n", params.contents);
        request.post({
            url: BASE_URL + "extraction",
            body: params.contents,
            headers: { 'content-type': 'text/plain' }
        }, (error, res, body) => {
            if (error) {
                console.log(error);
                return reject(error);
            } else {
                console.log(`[Extraction] response: ${body}`);
                if (body.charAt(0) === 'E' || body.charAt(0) === 'S') {
                    return reject("Error: " + body);
                }
                resolve(body);
            }
        });
    });
}

exports.queryUpdate = (params) => {
    return new Promise((resolve, reject) => {
        if (!params.token) return reject("No update token found.");
        request.post({
            url: BASE_URL + "update",
            body: params.token,
            headers: { 'content-type': 'text/plain' }
        }, (error, res, body) => {
            if (error) {
                console.log(error);
                return reject(error);
            } else {
                console.log(`[Update] ${params.token}:\n=====\n${body}`);
                var resultLines = body.split("\n");
                let guessResults = resultLines.filter((line) => {
                	return line.indexOf("--") > -1;
                });
                guessResults = guessResults.map((guess) => {
                	return {
                		guess: guess.split("--")[0].toUpperCase().trim(),
                		extraction: guess.split("--")[1].toUpperCase().trim()
                	}
                });
                const data = {
                    finished: resultLines[0].trim() !== 'running',
                    results: guessResults
                }
                resolve(data);
            }
        });
    });
}