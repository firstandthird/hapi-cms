const tap = require('tap');
const Hapi = require('hapi');
const plugin = require('../index.js');
const Joi = require('joi');
const Boom = require('boom');
//tap.runOnly = true;

const DEFAULT_PORT = 5000;

tap.test('request handler will get data for a given slug', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  // a server method to wait for:
  server.method('getImage', (name) => new Promise(resolve => resolve({
    image: 'someawesome.jpg',
    copy: 'this is the best page ever'
  })));

  await server.register({
    plugin,
    options: {
      getPage(slug, request, h) {
        t.equal(slug, 'page-one', 'passes correct slug to getPage');
        t.notEqual(request, null);
        t.notEqual(h, null);
        return {
          _template: '',
          key1: 'value1',
          key2: 'value2',
          hero: 'getImage()'
        };
      }
    }
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200');
  t.match(res.result, {
    _template: '',
    key1: 'value1',
    key2: 'value2',
    hero: {
      image: 'someawesome.jpg',
      copy: 'this is the best page ever'
    }
  }, 'returns the correct data for the slug');
  await server.stop();
  t.end();
});

tap.test('only call methods for things that look like methods', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  // a server method to wait for:
  server.method('getImage', (name) => new Promise(resolve => resolve({
    image: 'someawesome.jpg',
    copy: 'this is the best page ever'
  })));

  await server.register({
    plugin,
    options: {
      getPage(slug) {
        t.equal(slug, 'page-one', 'passes correct slug to getPage');
        return {
          _template: '',
          key1: 'value1',
          key2: 'value2',
          hero: 'blah asdjasd a getImage()'
        };
      }
    }
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200');
  t.match(res.result, {
    _template: '',
    key1: 'value1',
    key2: 'value2',
    hero: 'blah asdjasd a getImage()'
  }, 'returns the correct data for the slug');
  await server.stop();
  t.end();
});

tap.test('allow namespaces', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  // a server method to wait for:
  server.method('utils.getImage', (name) => new Promise(resolve => resolve({
    image: 'someawesome.jpg',
    copy: 'this is the best page ever'
  })));

  await server.register({
    plugin,
    options: {
      getPage(slug) {
        t.equal(slug, 'page-one', 'passes correct slug to getPage');
        return {
          _template: '',
          key1: 'value1',
          key2: 'value2',
          hero: 'utils.getImage()'
        };
      }
    }
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200');
  t.match(res.result, {
    _template: '',
    key1: 'value1',
    key2: 'value2',
    hero: {
      image: 'someawesome.jpg',
      copy: 'this is the best page ever'
    }
  }, 'returns the correct data for the slug');
  await server.stop();
  t.end();
});

tap.test('pass in page data to methods', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  // a server method to wait for:
  server.method('getImage', (name) => new Promise(resolve => resolve({
    image: `${name}.jpg`,
    copy: 'this is the best page ever'
  })));

  await server.register({
    plugin,
    options: {
      getPage(slug) {
        t.equal(slug, 'page-one', 'passes correct slug to getPage');
        return {
          _template: '',
          key1: 'value1',
          key2: 'value2',
          hero: 'getImage(page.key1)'
        };
      }
    }
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200');
  t.match(res.result, {
    _template: '',
    key1: 'value1',
    key2: 'value2',
    hero: {
      image: 'value1.jpg',
      copy: 'this is the best page ever'
    }
  }, 'returns the correct data for the slug');
  await server.stop();
  t.end();
});

tap.test('plugin will error if no getPage method is provided', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  try {
    await server.register({
      plugin,
      options: {}
    });
  } catch (e) {
    t.isA(e, Error);
    return t.end();
  }
  t.fail();
});

tap.test('request handler will render a view for a given slug', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  await server.register([
    require('vision'),
    {
      plugin,
      options: {
        getPage(slug) {
          return {
            _template: 'testTemplate',
            alphabet: [
              { portion: 'abc' },
              { portion: 'def' },
              { portion: 'ghi' },
            ]
          };
        }
      }
    }
  ]);
  server.views({
    engines: { html: require('handlebars') },
    path: `${__dirname}/views`
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200');
  t.match(res.result, 'abcdefghi');
  await server.stop();
  t.end();
});

tap.test('request handler will always return data if ?json=1', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  await server.register([
    require('vision'),
    {
      plugin,
      options: {
        getPage(slug) {
          return {
            _template: 'testTemplate',
            key1: 'value1',
            key2: 'value2'
          };
        }
      }
    }
  ]);
  server.views({
    engines: { html: require('handlebars') },
    path: `${__dirname}/views`
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one?json=1'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200');
  t.match(res.result, {
    _template: 'testTemplate',
    key1: 'value1',
    key2: 'value2'
  }, 'returns the correct data for the slug');
  await server.stop();
  t.end();
});

tap.test('request handler will handle no data being returned', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  await server.register([
    require('vision'),
    {
      plugin,
      options: {
        getPage(slug) {
          return;
        }
      }
    }
  ]);
  server.views({
    engines: { html: require('handlebars') },
    path: `${__dirname}/views`
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200');
  t.deepEqual(res.result, {});
  await server.stop();
  t.end();
});

tap.test('request handler will handle errors thrown', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  await server.register([
    require('vision'),
    {
      plugin,
      options: {
        getPage(slug) {
          throw Boom.notFound();
        }
      }
    }
  ]);
  server.views({
    engines: { html: require('handlebars') },
    path: `${__dirname}/views`
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one'
  });
  t.equal(res.statusCode, 404, 'returns HTTP 404');
  t.deepEqual(res.result, {
    error: 'Not Found',
    message: 'Not Found',
    statusCode: 404
  });
  await server.stop();
  t.end();
});

tap.test('options.routePrefix will prefix the request handler', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  // a server method to wait for:
  server.method('getImage', (name) => new Promise(resolve => resolve({
    image: 'someawesome.jpg',
    copy: 'this is the best page ever'
  })));

  await server.register({
    plugin,
    options: {
      routePrefix: '/render',
      getPage(slug) {
        return {
          _template: '',
          key1: 'value1',
          key2: 'value2',
          hero: 'getImage()'
        };
      }
    }
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/render/page-one'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200');
  t.match(res.result, {
    _template: '',
    key1: 'value1',
    key2: 'value2',
    hero: {
      image: 'someawesome.jpg',
      copy: 'this is the best page ever'
    }
  }, 'returns the correct data for the slug');
  await server.stop();
  t.end();
});

tap.test('options.globalData will augment the data fetched from getPage', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  // a server method to wait for:
  server.method('getImage', (name) => new Promise(resolve => resolve({
    image: 'someawesome.jpg',
    copy: 'this is the best page ever'
  })));

  await server.register({
    plugin,
    options: {
      globalData: {
        key2: 'value2',
        hero: 'getImage()'
      },
      getPage(slug) {
        t.equal(slug, 'page-one', 'passes correct slug to getPage');
        return {
          _template: '',
          key1: 'value1'
        };
      }
    }
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200');
  t.match(res.result, {
    _template: '',
    key1: 'value1',
    key2: 'value2',
    hero: {
      image: 'someawesome.jpg',
      copy: 'this is the best page ever'
    }
  }, 'returns the correct data for the slug');
  await server.stop();
  t.end();
});

tap.test('options.validateData will notify of problems in the provided data', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  // a server method to wait for:
  server.method('getImage', (name) => new Promise(resolve => resolve({
    image: 'someawesome.jpg',
    copy: 'this is the best page ever'
  })));

  await server.register({
    plugin,
    options: {
      validateData(data) {
        if (data.slug === 'page-one') {
          return data;
        }
        const result = Joi.validate(data, Joi.object().keys({
          notIncluded: Joi.string().required()
        }));
        return result.error;
      },
      getPage(slug) {
        return {
          _template: '',
          slug,
          key1: 'value1',
          key2: 'value2',
          hero: 'getImage()'
        };
      }
    }
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200 for valid data');
  const res2 = await server.inject({
    method: 'get',
    url: '/page-two'
  });
  t.equal(res2.statusCode, 400, 'returns HTTP 400 for invalid data');
  await server.stop();
  t.end();
});

tap.test('options.dataKey will send data as that key', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });

  await server.register({
    plugin,
    options: {
      dataKey: 'content',
      getPage(slug) {
        return {
          _template: '',
          slug,
          key1: 'value1',
          key2: 'value2',
        };
      }
    }
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200');
  t.match(res.result, {
    _template: '',
    content: {
      _template: '',
      slug: 'page-one',
      key1: 'value1',
      key2: 'value2',
    }
  }, 'returns the correct data for the slug');
  await server.stop();
  t.end();
});

tap.test('supports debug mode', async t => {
  const server = new Hapi.Server({
    port: DEFAULT_PORT
  });

  let logged = 0;
  server.events.on('log', (tags, msg) => {
    logged++;
  });

  await server.register({
    plugin,
    options: {
      dataKey: 'content',
      getPage(slug) {
        return {
          _template: '',
          slug,
          key1: 'value1',
          key2: 'value2',
        };
      }
    }
  });

  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one?debug=1'
  });
  t.equal(res.statusCode, 200, 'returns HTTP 200');
  t.match(res.result, {
    _template: '',
    content: {
      _template: '',
      slug: 'page-one',
      key1: 'value1',
      key2: 'value2',
    }
  }, 'returns the correct data for the slug');
  t.ok((logged > 0), 'Debugging sent logs as expected');
  await server.stop();
  t.end();
});

tap.test('getPage method can return toolkit to return early', async t => {
  const server = new Hapi.Server({ port: DEFAULT_PORT });
  await server.register([
    require('vision'),
    {
      plugin,
      options: {
        getPage(slug, request, h) {
          return h.redirect('/');
        }
      }
    }
  ]);
  server.views({
    engines: { html: require('handlebars') },
    path: `${__dirname}/views`
  });
  server.route({
    method: 'get',
    path: '/',
    handler(request, h) {
      return 'ok';
    }
  });
  await server.start();
  const res = await server.inject({
    method: 'get',
    url: '/page-one'
  });
  t.equal(res.statusCode, 302, 'returns HTTP 302');
  await server.stop();
  t.end();
});
