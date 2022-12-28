const countProps = (obj) => {
    let count = 0;
    for (let prop in obj)
        count++;
    return count;
};

const hasProps = (obj) => {
    for (let prop in obj)
        return true;
    return false;
};

const hasPropsExcept = (obj, except = []) => {
    exclude = except.map(elem => elem.toString());
    for (let prop in obj) {
        if (exclude.indexOf(prop) < 0)
            return true;
    }
    return false;
};

const forEachProp = (obj, cb) => {
    for (let prop in obj)
        cb(prop, obj[prop]);
};

module.exports = {
    countProps,
    hasProps,
    hasPropsExcept,
    forEachProp
}