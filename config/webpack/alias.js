var alias = {
    'jquery': 'jquery/dist/jquery.min.js'
};

const path = require('path');
const NODE_MODULES_DIR = path.join(__dirname, '../../node_modules');

module.exports = function (config) {
    //resolve
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    //noParse
    config.module = config.module || {};
    config.module.noParse = config.module.noParse || [];
    for (var k in alias) {
        if (alias.hasOwnProperty(k)) {
            var depPath = path.resolve(NODE_MODULES_DIR, alias[k]);
            config.resolve.alias[k] = depPath;
            config.module.noParse.push(depPath);
        }
    }
    return config;
}