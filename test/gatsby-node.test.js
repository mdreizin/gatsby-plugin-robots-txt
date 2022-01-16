import { fs as memoryFs } from 'memfs';
import path from 'path';
import util from 'util';

jest.doMock('fs', jest.fn(() => memoryFs));
jest.doMock('fs/promises', jest.fn(() => ({
  writeFile: util.promisify(memoryFs.writeFile),
  readFile: util.promisify(memoryFs.readFile),
  mkdir: util.promisify(memoryFs.mkdirp),
})));

const fs = require('fs');
const fsp = require('fs/promises');
const { onPostBuild } = require('../src/gatsby-node');

const publicPath = './public';
const graphqlOptions = {
  site: {
    siteMetadata: {
      siteUrl: 'https://www.test.com'
    }
  }
};

function resolvePath(filename) {
  return path.resolve(path.join(publicPath, filename));
}

describe('onPostBuild', () => {
  beforeAll(async () => fsp.mkdir(path.resolve(publicPath)));

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

    const data = await fsp.readFile(resolvePath(output))

    expect(data.toString()).toMatchSnapshot();
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

    const data = await fsp.readFile(resolvePath(output))

    expect(data.toString()).toMatchSnapshot();
  });

  it('should generate a `robots.txt` without a host property', async () => {
    const output = './robots-host-null.txt';

    await onPostBuild(
      {
        graphql() {
          return Promise.resolve({ data: {} })
        }
      },
      {
        host: null,
        sitemap: 'https://www.test.com/sitemap.xml',
        output
      })

    const data = await fsp.readFile(resolvePath(output))

    expect(data.toString()).toMatchSnapshot();
  })

  it('should generate a `robots.txt` without a sitemap property', async () => {
    const output = './robots-sitemap-null.txt';

    await onPostBuild(
      {
        graphql() {
          return Promise.resolve({ data: {} })
        }
      },
      {
        host: 'https://www.test.com',
        sitemap: null,
        output
      })

    const data = await fsp.readFile(resolvePath(output))

    expect(data.toString()).toMatchSnapshot();
  })

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

    expect(fs.existsSync(resolvePath(output))).toBeFalsy();
  });

  it('should not generate `robots.txt` in case of I/O errors', async () => {
    const output = './robots-io-err.txt';

    const spy = jest
      .spyOn(fsp, 'writeFile')
      .mockImplementation(() => {
        return new Promise((_, reject) => {
          reject(new Error('error'))
        })
      });

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

    expect(fs.existsSync(resolvePath(output))).toBeFalsy();

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

    const data = await fsp.readFile(resolvePath(output))

    expect(data.toString()).toMatchSnapshot();
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

    const data = await fsp.readFile(resolvePath(output))

    expect(data.toString()).toMatchSnapshot();
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

    const data = await fsp.readFile(resolvePath(output))

    expect(data.toString()).toContain('Sitemap: https://www.test.com/sitemap-test.xml');
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

    const data = await fsp.readFile(resolvePath(output))

    expect(data.toString()).toContain('Sitemap: https://www.test.com/sitemap-test-relative.xml');
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

    const data = await fsp.readFile(resolvePath(output))

    expect(data.toString()).toContain('Sitemap: https://www.test.com/prefix/sitemap/sitemap-index.xml');
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

    const data = await fsp.readFile(resolvePath(output))

    expect(data.toString()).toContain('Sitemap: https://www.test.com/prefix/sitemap.xml');
  })

  it(`should not add pathPrefix if provided sitemap already has prefix`, async () => {
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

    const data = await fsp.readFile(resolvePath(output))

    expect(data.toString()).toContain('Sitemap: https://www.test.com/prefix/sitemap.xml');
  })
});
