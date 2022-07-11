# File Structure Docs

Allow to add labels and descriptions to document the contents of specific files and folders on your project.


## usage

This extension requires a file named `fsdocs.config.json` to be added to your project, with the following structure:

```json
{
  "environments": {
    "dev": "🟢",
    "tip": "🟡",
    "prod": "🔴"
  },
  "types": {
    "config-file": "📄️",
    "package": "📦️",
    "provider": "☁️️"
  },
  "items": {
    "59237813-c25f-44cb-942f-9c571214bfed": {
      "description": "Here is more info about this provider.",
      "label": "MAIN PROVIDER",
      "environment": "dev",
      "type": "provider"
    },
    "9eec0c6b-e0af-4c71-939a-15223a51e2a4": {
      "label": "PKG 123",
      "type": "package",
      "environment": "dev"
    },
    "db509caa-57a2-4e46-b445-dd8555d66b63": {
      "label": "PKG 456",
      "type": "package",
      "environment": "dev"
    },
    "deploy.json": {
      "label": "deploy configuration",
      "type": "config-file"
    }
  }
}
```

### enviroments / types

These dictionaries contain different indicators to show right next to the label of an item.

### items

Collection of identifiers to be used to match with the names of the folders/files in the project. 

* **label (required)**: label of the item associated with the identifier.
* **description (optional)**: description that will be shown in the tooltip of the item.
* **environment (optional)**: environment in which the item runs.
  * it will look for an indicator within the **environments** section.
* **type (optional)**: type of the item.
  * it will look for an indicator within the **types** section.


![example](https://raw.githubusercontent.com/fedecalendino/vscode-fsdocs/main/images/screenshot.png)