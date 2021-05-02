import { fs as memoryFs } from 'memfs';
import path from 'path';

jest.doMock('fs', jest.fn(() => memoryFs));

const fs = require('fs');
const { onPostBuild } = require('../src/gatsby-node');

const publicPath = './public';
const graphqlOptions = {
  site: {
    siteMetadata: {
      siteUrl: 'https://www.test.com'
    }
  }
};

function contentPath(filename) {
  return path.resolve(path.join(publicPath, filename));
}

function readContent(filename) {
  return fs.readFileSync(contentPath(filename)).toString();
}

describe('onPostBuild', () => {
  beforeAll(() => fs.mkdirpSync(path.resolve(publicPath)));

  it('should generate `robots.txt` using options', async () => {
    const output = './robots.txt';

    await onPostBuild(
      {
        graphql() {
          return Promise.resolve({ data: {} });
        }
      },
      {
        host: 'https://www.test.com',
        sitemap: 'https://www.test.com/sitemap.xml',
        output
      }
    );

    expect(readContent(output)).toMatchSnapshot();
  });

  it('should generate `robots.txt` using `graphql` options', async () => {
    const output = './robots-graphql.txt';

    await onPostBuild(
      {
        graphql() {
          return Promise.resolve({ data: graphqlOptions });
        }
      },
      {
        output
      }
    );

    expect(readContent(output)).toMatchSnapshot();
  });

  it('should not generate `robots.txt` in case of `graphql` errors', async () => {
    const output = './robots-graphql-err.txt';

    await expect(
      onPostBuild(
        {
          graphql() {
            return Promise.resolve({ errors: ['error1', 'error2'] });
          }
        },
        { output }
      )
    ).rejects.toEqual(new Error('error1, error2'));

    expect(fs.existsSync(contentPath(output))).toBeFalsy();
  });

  it('should not generate `robots.txt` in case of I/O errors', async () => {
    const output = './robots-io-err.txt';

    const spy = jest
      .spyOn(fs, 'writeFile')
      .mockImplementation((file, data, callback) =>
        callback(new Error('error'))
      );

    await expect(
      onPostBuild(
        {
          graphql() {
            return Promise.resolve({ data: graphqlOptions });
          }
        },
        { output }
      )
    ).rejects.toEqual(new Error('error'));

    expect(fs.existsSync(contentPath(output))).toBeFalsy();

    spy.mockRestore();
  });

  it('should generate `robots.txt` using `env` options', async () => {
    const output = './robots-env.txt';

    await onPostBuild(
      {
        graphql() {
          return Promise.resolve({ data: {} });
        }
      },
      {
        host: 'https://www.test.com',
        sitemap: 'https://www.test.com/sitemap.xml',
        output,
        env: {
          test: {
            policy: [{ userAgent: '*', disallow: ['/'] }]
          }
        }
      }
    );

    expect(readContent(output)).toMatchSnapshot();
  });

  it('should generate `robots.txt` using `env` options and `resolveEnv` function', async () => {
    const output = './robots-env-custom.txt';

    await onPostBuild(
      {
        graphql() {
          return Promise.resolve({ data: {} });
        }
      },
      {
        host: 'https://www.test.com',
        sitemap: 'https://www.test.com/sitemap.xml',
        output,
        resolveEnv: () => 'custom',
        env: { custom: { policy: [{ userAgent: '*', disallow: ['/'] }] } }
      }
    );

    expect(readContent(output)).toMatchSnapshot();
  });

  it(`should set sitemap separate from host`, async () => {
    const output = './robots-sitemap.txt';

    await onPostBuild(
      {
        graphql() {
          return Promise.resolve({ data: graphqlOptions });
        }
      },
      {
        sitemap: 'https://www.test.com/sitemap-test.xml',
        output,
        resolveEnv: () => 'custom',
        env: { custom: { policy: [{ userAgent: '*', disallow: ['/'] }] } }
      }
    );

    expect(readContent(output)).toContain('Sitemap: https://www.test.com/sitemap-test.xml');
  })

  it(`should set sitemap using host if not absolute`, async () => {
    const output = './robots-sitemap-relative.txt';

    await onPostBuild(
      {
        graphql() {
          return Promise.resolve({ data: graphqlOptions });
        }
      },
      {
        sitemap: 'sitemap-test-relative.xml',
        output,
        resolveEnv: () => 'custom',
        env: { custom: { policy: [{ userAgent: '*', disallow: ['/'] }] } }
      }
    );

    expect(readContent(output)).toContain('Sitemap: https://www.test.com/sitemap-test-relative.xml');
  })

  it(`should add pathPrefix to defaults`, async () => {
    const output = './robots-sitemap-prefix.txt';
    const pathPrefix = '/prefix'

    await onPostBuild(
      {
        graphql() {
          return Promise.resolve({ data: graphqlOptions });
        },
        pathPrefix
      },
      {
        output,
      }
    );

    expect(readContent(output)).toContain('Sitemap: https://www.test.com/prefix/sitemap-index.xml');
  })

  it(`should add pathPrefix to provided sitemap`, async () => {
    const output = './robots-sitemap-prefix-provided.txt';
    const pathPrefix = '/prefix'

    await onPostBuild(
      {
        graphql() {
          return Promise.resolve({ data: graphqlOptions });
        },
        pathPrefix
      },
      {
        output,
        sitemap: 'sitemap.xml'
      }
    );

    expect(readContent(output)).toContain('Sitemap: https://www.test.com/prefix/sitemap.xml');
  })

  it(`should not add pathPrefix if provided sitemap alread has prefix`, async () => {
    const output = './robots-sitemap-prefix-provided.txt';
    const pathPrefix = '/prefix'

    await onPostBuild(
      {
        graphql() {
          return Promise.resolve({ data: graphqlOptions });
        },
        pathPrefix
      },
      {
        output,
        sitemap: '/prefix/sitemap.xml'
      }
    );

    expect(readContent(output)).toContain('Sitemap: https://www.test.com/prefix/sitemap.xml');
  })
});
