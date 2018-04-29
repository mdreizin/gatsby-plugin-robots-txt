[![NPM version](https://img.shields.io/npm/v/gatsby-plugin-robots-txt.svg)](https://www.npmjs.org/package/gatsby-plugin-robots-txt)
[![Travis build status](https://travis-ci.org/mdreizin/gatsby-plugin-robots-txt.svg?branch=master)](https://travis-ci.org/mdreizin/gatsby-plugin-robots-txt)
[![AppVeyor build status](https://ci.appveyor.com/api/projects/status/ow75w9pjm7kf3wps/branch/master?svg=true)](https://ci.appveyor.com/project/mdreizin/gatsby-plugin-robots-txt/branch/master)
[![Dependency Status](https://img.shields.io/david/mdreizin/gatsby-plugin-robots-txt.svg)](https://david-dm.org/mdreizin/gatsby-plugin-robots-txt)
[![Development Dependency Status](https://img.shields.io/david/dev/mdreizin/gatsby-plugin-robots-txt.svg)](https://david-dm.org/mdreizin/gatsby-plugin-robots-txt#info=devDependencies)
[![Greenkeeper badge](https://badges.greenkeeper.io/mdreizin/gatsby-plugin-robots-txt.svg)](https://greenkeeper.io/)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fmdreizin%2Fgatsby-plugin-robots-txt.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fmdreizin%2Fgatsby-plugin-robots-txt?ref=badge_shield)

# gatsby-plugin-robots-txt

> Create `robots.txt` for your Gatsby site.

## Install

`yarn add gatsby-plugin-robots-txt`

or

`npm install --save gatsby-plugin-robots-txt`

## How to Use

`gatsby-config.js`

```js
module.exports = {
  siteMetadata: {
    siteUrl: 'https://www.example.com'
  },
  plugins: ['gatsby-plugin-robots-txt']
};
```

## Options

This plugin uses [`generate-robotstxt`](https://github.com/itgalaxy/generate-robotstxt#usage) to generate content of `robots.txt` and it has the following options:

|   Name    |    Type    |                Default                |      Description       |
| :-------: | :--------: | :-----------------------------------: | :--------------------: |
|  `host`   |  `String`  |       `${siteMetadata.siteUrl}`       |   Host of your site    |
| `sitemap` |  `String`  | `${siteMetadata.siteUrl}/sitemap.xml` | Path to `sitemap.xml`  |
| `policy`  | `Policy[]` |                 `[]`                  | List of `Policy` rules |

You can specify any allowed [`generate-robotstxt`](https://github.com/itgalaxy/generate-robotstxt#usage) options:

`gatsby-config.js`

```js
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-plugin-robots-txt',
      options: {
        host: 'https://www.example.com',
        sitemap: 'https://www.example.com/sitemap.xml',
        policy: [{ userAgent: '*', allow: '/' }]
      }
    }
  ]
};
```

### Netlify

If you would like to disable crawlers for [deploy-previews](https://www.netlify.com/blog/2016/07/20/introducing-deploy-previews-in-netlify/) you can use the following snippet:

`gatsby-config.js`

```js
const {
  NODE_ENV,
  URL: NETLIFY_SITE_URL = 'https://www.example.com',
  DEPLOY_PRIME_URL: NETLIFY_DEPLOY_URL = NETLIFY_SITE_URL,
  CONTEXT: NETLIFY_ENV = NODE_ENV
} = process.env;
const isNetlifyProduction = NETLIFY_ENV === 'production';
const siteUrl = isNetlifyProduction ? NETLIFY_SITE_URL : NETLIFY_DEPLOY_URL;

module.exports = {
  siteMetadata: {
    siteUrl
  },
  plugins: [
    {
      resolve: 'gatsby-plugin-robots-txt',
      options: isNetlifyProduction
        ? { policy: [{ userAgent: '*' }] }
        : {
            policy: [{ userAgent: '*', disallow: ['/'] }],
            sitemap: null,
            host: null
          }
    }
  ]
};
```

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fmdreizin%2Fgatsby-plugin-robots-txt.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fmdreizin%2Fgatsby-plugin-robots-txt?ref=badge_large)
