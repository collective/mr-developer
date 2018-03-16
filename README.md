# ng-mr-developer

ng-mr-developer is an NPM utility allowing to checkout various libraries from their Git repository as dependencies in an Angular project.

Dependencies are listed in a file named `mr.developer.json`:

```
  {
    "ngx-tooltip": {
        "url": "https://github.com/pleerock/ngx-tooltip.git"
    },
    "angular-traversal": {
        "url": "https://github.com/makinacorpus/angular-traversal",
        "branch": "staging"
    }
  }
```

By running the `mrdevelop` command, those repositories will be checked out in the `./src/develop` folder and they will be added into the `tsconfig.json` file in the `path` property, so the compiler will use them instead of the `node_modules` ones.