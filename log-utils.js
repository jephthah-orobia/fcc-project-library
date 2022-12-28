require('dotenv').config();

const { hasProps } = require('./obj-utils');

const isDebugging = false;

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

const logPropsOf = (label, obj, indent = 2) => {
    if (isDebugging && hasProps(obj)) {
        for (var i = 0; i < indent; i++)
            console.group();
        console.log(label);
        console.dir(obj, { compact: false, colors: true });
        for (var i = 0; i < indent; i++)
            console.groupEnd();
    }
}

const logRequest = (req, res, next) => {
    log(req.protocol, ":", req.method, "request from:", req.ip);
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