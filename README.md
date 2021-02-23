# hapi-cms

A hapi plugin that simplifies rendering views with hapi server.  You provide your own custom `getPage` function to handle fetching the page content from your preferred repository and hapi-cms will handle setting up the render vars for the page, validating the data and rendering it all as a view.

## Installation

```sh
npm install rapptor
```


## Usage

hapi-cms works by registering a route in hapi at `/{slug*}`.  


## Options

- __getPage(slug, request, h)__  (required)

    A user-defined function that takes in a page slug and handles fetching the appropriate content data for that page.

- __dataKey__


- __routePrefix__

  You can specify your own root for the CMS route.  For example if __routePrefix__ is 'cms' then your CMS route will be at `/cms/{slug*}`

- __routeConfig__

  any additional route config you want for the CMS route

- __globalData__

  any data to merge with the _data that was fetched

- __validateData(data)__

    override to validate the resulting data before using it in the _template, the default validation function is
```javascript
 validateData(date) { return Joi.validate(data, Joi.object()); }
```
