const Joi = require('joi');
const processData = require('./lib/processData');
const boom = require('boom');

const pluginDefaults = {
  // this is appended to the slug before calling getPage:
  routePrefix: '',
  // any additional config you want for the CMS route:
  routeConfig: {
  },
  // any data to merge with the _data that was fetched
  globalData: {
  },
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
      const page = await options.getPage(request.params.slug);
      // populate the content for that page:
      const allData = await processData(request, page, options.globalData);
      // validate that content:
      const validated = await options.validateData(allData);
      if (validated.error) {
        throw boom.boomify(validated.error);
      }

      // render/return the view if there is a template and JSON wasn't explicitly requested:
      if (page._template && request.query.json !== '1') {
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
