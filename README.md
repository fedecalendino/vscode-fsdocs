# File Structure Docs

This [VSCode](https://code.visualstudio.com/) [Extension](https://marketplace.visualstudio.com/VSCode) will 
allow you decorate different items of your project's file structure with labels and descriptions to document their contents.


## usage

To work this extension needs a file name `fsdocs.config.json`, at the root of your project, with the following structure:

```json
{
  "info" : {
		"about": "This file is meant to be used with the FSDocs VSCode extension",
		"url": "https://marketplace.visualstudio.com/items?itemName=fedecalendino.fsdocs"
	},

	"authors": [
		"You <you@example.com>"
	],

	"ignore": [
		".git",
		".vscode"
	],
  
  "environments": {
    "dev": "🟢",
    "prod": "🔴"
  },

  "types": {
    "config-file": "📄️",
    "package": "📦️",
    "provider": "☁️️"
  },

  "items": {
    "59237813-c25f-44cb-942f-9c571214bfed": {
      "label": "MAIN PROVIDER",
      "environment": "dev",
      "type": "provider"
    },
    "9eec0c6b-e0af-4c71-939a-15223a51e2a4": {
      "description": "Here is more info about this provider.",
      "label": "PKG 123",
      "type": "package",
      "environment": "dev"
    },
    "db509caa-57a2-4e46-b445-dd8555d66b63": {
      "label": "PKG 456",
      "type": "package",
      "environment": "dev"
    },
    "old.py": {
      "label": "oldie",
      "description": "here is more documentation for you",
      "environment": "prod"
    }
  }
}
```

### info

Simple information about the file, so users can know about its use and the extenstion.


### authors

List of people that have made changes to the configuration file.


### ignore

List of files and folders that should not be analyzed by the extension.


### enviroments / types

These contain different indicators to show right next to the label of an item.


### items

Collection of identifiers to be used to match with the names of the files and folders in the project. 

* **label**: label of the item associated with the identifier.
* **description (optional)**: description that will be shown in the tooltip of the item.
* **environment (optional)**: environment in which the item runs.
    * it will look for an indicator within the **environments** section.
* **type (optional)**: type of the item.
    * it will look for an indicator within the **types** section.


![screenshot showing the configuration file and the result in the extension activity view](https://raw.githubusercontent.com/fedecalendino/vscode-fsdocs/main/images/screenshot.png)