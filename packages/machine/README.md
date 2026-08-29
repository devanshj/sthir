# `@sthir/machine`

This is a work in progress. Uses a fork of TypeScript with [PR #64092](https://github.com/microsoft/TypeScript/pull/64092). To try it update your `package.json` to include the following and run `npm install`...

```json
{
  "dependencies": {
    "@sthir/machine": "latest"
  },
  "devDependencies": {
    "typescript": "npm:@sthir/typescript@7.1.0-dev.20260829.1"
  },
  "optionalDependencies": {
    "@typescript/typescript-darwin-arm64": "npm:@sthir/typescript-darwin-arm64@7.1.0-dev.20260829.1",
    "@typescript/typescript-darwin-x64": "npm:@sthir/typescript-darwin-x64@7.1.0-dev.20260829.1",
    "@typescript/typescript-linux-arm": "npm:@sthir/typescript-linux-arm@7.1.0-dev.20260829.1",
    "@typescript/typescript-linux-arm64": "npm:@sthir/typescript-linux-arm64@7.1.0-dev.20260829.1",
    "@typescript/typescript-linux-x64": "npm:@sthir/typescript-linux-x64@7.1.0-dev.20260829.1",
    "@typescript/typescript-win32-arm64": "npm:@sthir/typescript-win32-arm64@7.1.0-dev.20260829.1",
    "@typescript/typescript-win32-x64": "npm:@sthir/typescript-win32-x64@7.1.0-dev.20260829.1"
  }
}
```

And also update your `.vscode/settings.json` to include the following...

```json
{
  "js/ts.experimental.useTsgo": true,
  "js/ts.tsdk.path": "./node_modules/typescript"
}
```

And then (you may have to reload the window first) click "Allow" on the "This workspace has a TypeScript 7 tsdk configured (7.1.0-dev.20260829.1). Would you like to use it?" prompt