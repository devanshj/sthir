# `@sthir/machine`

This is a work in progress and perhaps also temporary. Here's how to try it though...

```sh
npm install @sthir/machine
npm install -D typescript@npm:@sthir/typescript@7.1.0-dev.20260829.1
```

And add the following to your `package.json`...

```json
{
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