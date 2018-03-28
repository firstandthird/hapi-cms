const pprops = require('p-props');
const aug = require('aug');
const str2fn = require('str2fn');

module.exports = (request, page, globalData) => {
  const obj = aug(page, globalData);
  const allData = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value !== 'string' || value.indexOf('(') === -1) {
      allData[key] = value;
      return;
    }
    allData[key] = str2fn(value, request.server.methods, { request, page });
  });
  return pprops(allData);
};
