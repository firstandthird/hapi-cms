const Joi = require('joi');
const process = require('@firstandthird/process-data');
const boom = require('boom');
const aug = require('aug');

const pluginDefaults = {
  dataKey: null,
  // this is appended to the slug before calling getPage:
  routePrefix: '',
  // any additional config you want for the CMS route:
  routeConfig: {},
  // any data to merge with the _data that was fetched
  globalData: {},
  // override to validate the resulting data before using it in the _template
  validateData(data) {
    return Joi.validate(data, Joi.object());
  }
};

const register = (server, pluginOptions) => {
  const options = Object.assign({}, pluginDefaults, pluginOptions);
  if (typeof options.getPage !== 'function') {
    throw new Error('hapi-cms needs an options.getPage function in order to work');
  }
  server.route({
    method: 'get',
    path: `${options.routePrefix}/{slug*}`,
    config: options.routeConfig,
    async handler(request, h) {
      // get the page for that slug:
      const page = await options.getPage(request.params.slug, request, h);
      //check if page returns response, just return
      if (page && page.request && page.statusCode) {
        return page;
      }
      // populate the content for that page:
      const obj = aug({}, page, options.globalData);
      const context = aug({}, request.server.methods, { request, page });
      const debug = (request.query.debug === '1');
      const log = (msg) => {
        server.log(['hapi-cms', 'process-data', 'debug'], msg);
      };
      let allData = await process(obj, context, debug, log);
      // validate that content:
      const validatedResult = await options.validateData(allData);
      if (validatedResult instanceof Error) {
        throw boom.badRequest(validatedResult);
      }
      allData = validatedResult;
      if (options.dataKey) {
        allData = {
          [options.dataKey]: allData,
          _template: allData._template
        };
      }
      // render/return the view if there is a template and JSON wasn't explicitly requested:
      if (allData && allData._template && request.query.json !== '1') {
        return h.view(allData._template, allData);
      }
      // otherwise return the data:
      return allData;
    }
  });
};

exports.plugin = {
  register,
  name: 'hapi-cms',
  once: true,
  pkg: require('./package.json')
};
