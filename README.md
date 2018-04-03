# mr-developer

mr-developer is an NPM utility allowing to checkout various libraries from their Git repository as dependencies in an NPM project.

The paths to those local checkouts are added in `tsconfig.json` (or any file able to override `node_modules` )

Dependencies are listed in a file named `mr.developer.json`:

```
  {
    "ngx-tooltip": {
        "url": "https://github.com/pleerock/ngx-tooltip.git",
        "tag": "1.3.4"
    },
    "angular-traversal": {
        "url": "https://github.com/makinacorpus/angular-traversal",
        "branch": "staging"
    },
    "plone.restapi-angular": {
        "path": "src/lib",
        "package": "@plone/restapi-angular",
        "url": "git@github.com:plone/plone.restapi-angular.git"
    }
  }
```

By running the `mrdevelop` command, those repositories will be checked out in the `./src/develop` folder and they will be added into the `tsconfig.json` file in the `paths` property, so the compiler will use them instead of the `node_modules` ones.

## Usage

```
$ mrdevelop
```
will fetch last changes from each repositories, and checkout the specified branch.

```
$ mrdevelop --no-fetch
```
will just checkout the specified branch.

## Config file structure

The entry key is used to name the folder where we checkout the repository in `./src/develop`.

Properties:

- `package`: Optional. Name of the package that will be mention in `paths`. If not provided, defauklt to entry key.
- `path`: Optional. Source path in the repository. Will be concatenated to the local repository path in `tsconfig.json`.
- `url`: Mandatory. Git repository remote URL.
- `branch`: Optional. Branch name, default to `master`. Ignored if `tag` is defined.
- `tag`: Optional. Tag name.

## Credits

mr-developer is shamelessly inspired by the well-known [mr.developer](https://pypi.python.org/pypi/mr.developer) Python buildout extension.
