const pprops = require('p-props');
const aug = require('aug');
const str2fn = require('str2fn');

module.exports = (request, page, globalData) => {
  const obj = aug(page, globalData);
  const allData = {};
  const regex = new RegExp(/^[a-zA-Z.0-9]+\(.*\)$/);
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'string' && value.match(regex)) {
      allData[key] = str2fn(value, request.server.methods, { request, page });
      return;
    }
    allData[key] = value;
  });
  return pprops(allData);
};
