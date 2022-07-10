# vscode-sidebar-descriptor



Allow to define descriptions to specific folder/file names to show on the sidebar.

## setup

Include a `sidebar-descriptors.config.json` in your project:


```json
{
  "environments": {
    "dev": "🟢",
    "tip": "🟡",
    "prod": "🔴"
  },
  "types": {
    "resource-group": "📦️",
    "subscription": "🔑️"
  },
  "items": {
    "9eec0c6b-e0af-4c71-939a-15223a51e2a4": {
      "comments": "optional extra comments",
      "description": "sub123",
      "environment": "dev",
      "type": "subscription"
    },
    "59237813-c25f-44cb-942f-9c571214bfed": {
      "description": "ABC1110",
      "environment": "dev",
      "type": "resource-group"
    },
    "file.json": {
      "description": "XYZ121",
      "environment": "dev",
      "type": "resource-group"
    }
  }
}
```


![example](./screenshots/usage.png)