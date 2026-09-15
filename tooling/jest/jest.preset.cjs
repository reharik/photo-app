const nxPreset = require("@nx/jest/preset");
module.exports = nxPreset && nxPreset.default ? nxPreset.default : nxPreset;
