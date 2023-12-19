import { buildApp } from '@/lib/build';
import { BaseConfig, DEFAULT_CONFIG } from '@/lib/config';
import * as fs from '@/lib/utils/fs';

import { vol, } from 'memfs';
jest.mock('fs', () => require('memfs').fs);
jest.mock('fs/promises', () => require('memfs').fs.promises);

const app_example_1 = {
  "./bos.config.json": JSON.stringify({
    ...DEFAULT_CONFIG,
    account: "test.near",
    ipfs: {
      gateway: "https://testipfs/ipfs",
    },
    format: true,
  }),
  "./aliases.json": JSON.stringify({
    "name": "world",
  }),
  "./ipfs/logo.svg": "<svg viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='red' /></svg>",
  "./module/hello/utils.ts": "const hello = (name: string) => `Hello, ${name}!`; export default { hello };",
  "./widget/index.tsx": "type Hello = {}; const hello: Hello = 'hi'; export default hello;",
  "./widget/index.metadata.json": JSON.stringify({
    name: "Hello",
    description: "Hello world widget",
  }),
  "./widget/module.tsx": "VM.require('@{module/hello/utils}'); export default hello('world');",
  "./widget/config.jsx": "return <h1>@{config/account}@{config/account/deploy}</h1>;",
  "./widget/alias.tsx": "export default <h1>Hello @{alias/name}!</h1>;",
  "./widget/ipfs.tsx": "export default <img height='100' src='@{ipfs/logo.svg}' />;",
  "./data/thing/data.json": JSON.stringify({
    "type": "efiz.near/type/thing",
  })
};

const app_example_1_output = {
  "/build/ipfs.json": JSON.stringify({
    "logo.svg": "QmHash",
  }, null, 2) + "\n",
  "/build/widget/hello.utils.module.js": "const hello = (name) => `Hello, ${name}!`; return { hello };",
  "/build/widget/index.jsx": " const hello = 'hi'; return hello(props);",
  "/build/widget/module.jsx": "VM.require('test.near/widget/hello.utils.module'); return hello('world');",
  "/build/widget/config.jsx": "return <h1>test.neartest.near</h1>;",
  "/build/widget/alias.jsx": "return <h1>Hello world!</h1>;",
  "/build/widget/ipfs.jsx": "return <img height='100' src='https://testipfs/ipfs/QmHash' />;",
  "/build/data.json": JSON.stringify({
    "test.near": {
      thing: {
        data: JSON.stringify({
          "type": "efiz.near/type/thing",
        })
      },
      widget: {
        index: {
          metadata: {
            name: "Hello",
            description: "Hello world widget",
          }
        }
      }
    }
  }, null, 2),
};

const unmockedFetch = global.fetch;

describe('build', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON(app_example_1, '/app_example_1');

    global.fetch = (() => {
      return Promise.resolve({
        json: () => Promise.resolve({
          cid: "QmHash",
        })
      })
    }) as any;
  })
  afterAll(() => {
    global.fetch = unmockedFetch;
  })

  it('should build correctly without logs', async () => {
    const { logs } = await buildApp('/app_example_1', '/build');
    expect(logs).toEqual([]);
    expect(vol.toJSON('/build')).toEqual(app_example_1_output);
  })
})