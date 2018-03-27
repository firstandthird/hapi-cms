const wreck = require('wreck');
const Joi = require('joi');
const processData = require('./lib/processData');

const pluginDefaults = {
  // by default just GET whatever lives on the other end of the slug:
  getPage(slug) {
    return wreck.get(slug, { json: 'force' });
  },
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
  server.route({
    method: 'get',
    path: '/{slug*}',
    config: options.routeConfig,
    async handler(request, h) {
      // get slug:
      const slug = options.routePrefix !== '' ? `${options.routePrefix}/${request.params.slug}` : request.params.slug;
      // get the page for that slug:
      const page = await options.getPage(slug);
      // populate the content for that page:
      const content = await processData(request, page._data, options.globalData);
      // validate that content:
      const validated = await options.validateData(content);
      if (validated.error) {
        // todo: throw a boom error
      }

      // just return the data if requested:
      if (request.query.json === '1') {
        return content;
      }
      // return the view if there is a template:
      if (page._template) {
        return h.view(page._template, content);
      }
      // otherwise just return the data:
      return content;
    }
  });
};

exports.plugin = {
  register,
  name: 'hapi-cms',
  once: true,
  pkg: require('./package.json')
};
