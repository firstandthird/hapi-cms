# hapi-cms

A hapi plugin that simplifies rendering views with hapi server.  You provide your own custom `getPage` function to handle fetching the template page content from your preferred repository and hapi-cms will handle setting up the render vars for the page, validating the data and rendering it all as a view.

## Installation

```sh
npm install hapi-cms
```

## Usage

hapi-cms works by registering a route in hapi at `/{slug*}` that handles fetching and validating view data and rendering the view, the only thing you have to do to get it working is register your preferred template rendering engine with hapi and then define your `getPage() function`.  

The function takes in `getPage(slug, request, h)` and needs to
return an object of the form:
```JSON
{
  "_template": "<h1> Hello {{ aTemplateVariable }}!</h1>"
  "aTemplateVariable": "some value",
  "anotherTemplateVariable": "some other value"
}
```

__template_ should contain the template to be rendered, templates can be in whatever format is used by your view rendering engine

The remainining fields contain the data that your template will use for rendering and can be whatever you want.

## Example

Code:
```javascript
const hapiCms = require('hapi-cms');
const server = new Hapi.Server({});
await server.register({
  hapiCms,
  options: {
    routePrefix: '/render',
    async getPage(slug) {
      return {
        _template: '{{slug}} {{key1}}!',
        key1: 'World'
      };
    }
  }
});
await server.start();
```

Then get `http://localhost:8080/render/Hello` and you will get a page back:  'Hello World!'

getPage is an async function, so you can add whatever functionality you want (fetch a template, fetch a )


## Options

- __getPage(slug, request, h)__  (required)

    A user-defined function that takes in a page slug and handles fetching the appropriate content data for that page.

- __dataKey__

  By default hapi-cms stores your template variables at the top level along with the reserved _template field. Specifying a dataKey option will cause hapi-cms to store the template variables inside a sub-object under that key.  For example if you specify `dataKey: vars` then your data will be presented to the view rendering engine in the form
  ```JSON
  "_template": "<h1> my template {{vars.variable1}} </h1>",
  "vars": {
    "variable1": "a var",
    "variable2": "another var"
  }
  ```  
- __routePrefix__

  You can specify your own root for the CMS route.  For example if __routePrefix__ is 'cms' then your CMS route will be at `/cms/{slug*}`

- __routeConfig__

  any additional route config you want for the CMS route

- __globalData__

  any global data to always merge with the template variables  that were fetched

- __validateData(data)__

    override to validate the resulting data before using it in the _template, the default validation function is
```javascript
 validateData(date) { return Joi.validate(data, Joi.object()); }
```
