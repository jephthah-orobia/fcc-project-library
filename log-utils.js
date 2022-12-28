require('dotenv').config();

const { hasProps, hasPropsExcept, forEachProp } = require('./obj-utils');

let isDebugging = false;

const log = function () {
    if (isDebugging)
        console.log(...arguments);
}

const logEr = function () {
    if (isDebugging)
        console.error(...arguments);
}

const setDebugging = (debug) => {
    isDebugging = debug;
};

const logPropsOf = (label, obj) => {
    if (isDebugging) {
        console.log();
        console.group();
        console.group();
        console.group(label);
        console.dir(obj, { compact: false, colors: true });
        console.groupEnd();
        console.groupEnd();
        console.groupEnd();
    }
}

const logRequest = (req, res, next) => {
    console.log(req.protocol, ":", req.method, "request from:", req.ip);
    next();
}

const logParams = (req, res, next) => {
    logPropsOf('req.params', req.params);
    next();
};

const logQuery = (req, res, next) => {
    logPropsOf('req.query', req.query);
    next();
};

const logBody = (req, res, next) => {
    logPropsOf('req.body', req.body);
    next();
}

module.exports = {
    setDebugging,
    log,
    logEr,
    logRequest,
    logParams,
    logBody,
    logQuery,
    logPropsOf
};