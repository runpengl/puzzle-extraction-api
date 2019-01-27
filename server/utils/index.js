exports.transverse = (data) => {
    const _data = [];
    let numCols = 0;
    data.forEach((row) => {
        numCols = Math.max(numCols, row.length);
    });
    for (let i = 0; i < numCols; i++) {
    	_data.push([]);
    }
    data.forEach((row, ri) => {
        row.forEach((v, ci) => {
            _data[ci][ri] = v;
        });
    });
    return _data;
}

exports.stripEmpty = (data) => {
    return data.filter((row) => {
        return /\w+/i.test(row.join(""));
    });
}

exports.unique = (data) => {
    function stripRow(row) {
        return row.map((cell) => { return cell.replace(/[^\w]/gi, "") }).join("@").toUpperCase();
    }
    const strippedDataRows = data.map(stripRow);
    return data.filter((row, ri) => {
        const strippedRow = stripRow(row);
        return strippedDataRows.indexOf(strippedRow) === ri;
    });
}