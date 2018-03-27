const tap = require('tap');
const Hapi = require('hapi');
const plugin = require('../index.js');

tap.test('request handler will get data for a given slug', async t => {
  const server = new Hapi.Server({ port: 8080 });
  await server.register({
    plugin,
    options: {
      getPage(slug) {
        t.equal(slug, 'page-one', 'passes correct slug to getPage');
        return {
          _template: '',
          _data: {
            key1: 'value1',
            key2: 'value2'
          }
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
    key1: 'value1',
    key2: 'value2'
  }, 'returns the correct data for the slug');
  await server.stop();
  t.end();
});

tap.test('request handler will render a view for a given slug', async t => {
  const server = new Hapi.Server({ port: 8080 });
  await server.register([
    require('vision'),
    {
      plugin,
      options: {
        getPage(slug) {
          return {
            _template: 'testTemplate',
            _data: {
              alphabet: [
                { portion: 'abc' },
                { portion: 'def' },
                { portion: 'ghi' },
              ]
            }
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
  const server = new Hapi.Server({ port: 8080 });
  await server.register([
    require('vision'),
    {
      plugin,
      options: {
        getPage(slug) {
          return {
            _template: 'testTemplate',
            _data: {
              key1: 'value1',
              key2: 'value2'
            }
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
    key1: 'value1',
    key2: 'value2'
  }, 'returns the correct data for the slug');
  await server.stop();
  t.end();
});
