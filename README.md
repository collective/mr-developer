# ng-mr-developer

ng-mr-developer is an NPM utility allowing to checkout various libraries from their Git repository as dependencies in an Angular project.

Dependencies are listed in a file named `mr.developer.json`:

```
  {
    "@plone/restapi-angular": "git@github.com:plone/plone.restapi-angular.git",
    "angular-traversal": "git@github.com:makinacorpus/angular-traversal.git"
  }
```

By running the `develop` command, those repositories will be checked out in the `./src/develop` folder and they will be added into the `tsconfig.json` file in the `path` property, so the compiler will use them instead of the `node_modules` ones.