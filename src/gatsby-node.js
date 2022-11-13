import fsp from 'fs/promises';
import robotsTxt from 'generate-robotstxt';
import path from 'path';

const publicPath = './public';
const defaultEnv = 'development';
const defaultOptions = {
  output: '/robots.txt',
  query: `{
    site {
      siteMetadata {
        siteUrl
      }
    }
  }`
};

function runQuery(handler, query) {
  return handler(query).then(res => {
    if (res.errors) {
      throw new Error(res.errors.join(', '));
    }

    return res.data;
  });
}

const getOptions = pluginOptions => {
  const options = { ...pluginOptions };

  delete options.plugins;

  const { env = {}, resolveEnv = () => process.env.GATSBY_ACTIVE_ENV || process.env.NODE_ENV } = options;

  const envOptions = env[resolveEnv()] || env[defaultEnv] || {};

  delete options.env;
  delete options.resolveEnv;

  return { ...options, ...envOptions };
};

export async function onPostBuild({ graphql, pathPrefix = "" }, pluginOptions) {
  const userOptions = getOptions(pluginOptions);
  const mergedOptions = { ...defaultOptions, ...userOptions };

  if(mergedOptions.host !== null) {
    if (
      !Object.prototype.hasOwnProperty.call(mergedOptions, 'host')
    ) {
      const {
        site: {
          siteMetadata: { siteUrl }
        }
      } = await runQuery(graphql, mergedOptions.query);

      mergedOptions.host = siteUrl;
    }
  }

  if(mergedOptions.sitemap !== null) {
    if (
      !Object.prototype.hasOwnProperty.call(mergedOptions, 'sitemap')
    ) {

      mergedOptions.sitemap = new URL(path.posix.join(pathPrefix, 'sitemap-index.xml'), mergedOptions.host).toString();
    } else {
      try {
        new URL(mergedOptions.sitemap)
      } catch {
        mergedOptions.sitemap = new URL(mergedOptions.sitemap.startsWith(pathPrefix) ? mergedOptions.sitemap : path.posix.join(pathPrefix, mergedOptions.sitemap), mergedOptions.host).toString()
      }
    }
  }

  const { policy, sitemap, host, output, configFile } = mergedOptions;

  const content = await robotsTxt({
    policy,
    sitemap,
    host,
    configFile
  });
  const filename = path.join(publicPath, output);

  return fsp.writeFile(path.resolve(filename), content);
}
