# Setting up a dev environment

### Prerequisites

- git, any version
- Node.js >=16.16
- NPM >=8.11.0

Generally, we recommend following guidelines from [Node.js Releases](https://nodejs.org/en/about/releases/) to only use `Current`, `Active LTS` or `Maintenance LTS` releases.

### Setting up

If you use [nvm](https://github.com/nvm-sh/nvm), running following command inside this repository will automatically pick the right Node.js version for you:

```sh
 $ nvm use
```

This repository is using npm packages from https://www.npmjs.com/ and [GitHub packages registry](https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages). 
To successfully install npm packages that SwaggerEditor requires, you need to [Authenticate to GitHub Packages](https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages).

You can authenticate to GitHub Packages with npm by either editing your per-user *~/.npmrc*
file to include your personal access token (classic) or by logging in to npm on the command line using your username and personal access token.

To authenticate by adding your personal access token (classic) to your *~/.npmrc* file,
edit the *~/.npmrc* file for your project to include the following line,
replacing TOKEN with your personal access token. Create a new *~/.npmrc* file if one doesn't exist.
You can find more information about authenticating to GitHub Packages in [GitHub documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages).

```
//npm.pkg.github.com/:_authToken=TOKEN
```


Alternatively, to authenticate by logging in to npm, use the `npm login` command,
replacing USERNAME with your GitHub username, TOKEN with your personal access token (classic),
and PUBLIC-EMAIL-ADDRESS with your email address.

```sh
$ npm login --scope=@swagger-api --registry=https://npm.pkg.github.com

> Username: USERNAME
> Password: TOKEN
> Email: PUBLIC-EMAIL-ADDRESS
```

### Steps

1. `git clone https://github.com/swagger-api/swagger-js.git`
2. `cd swagger-js`
3. `npm install`
4. `npm run build`

### Testing with Swagger-UI

It is often the case that after fixing a bug or implementing a new feature,
developer wants to test his changes in [Swagger-UI](https://github.com/swagger-api/swagger-ui).
This section will guide you through how to do that.

**1. Clone and install swagger-ui repository**

You'll find complete information about how to do that in swagger-ui [Setting up documentation](https://github.com/swagger-api/swagger-ui/blob/master/docs/development/setting-up.md).

**2. Clone and install swagger-js repository**

You'll find complete information about how to do that in [Steps](setting-up.md#steps) section of this document.

**3. Link repositories using npm link**

```shell script
 $ cd /path/to/swagger-js
 $ npm run build
 $ npm link
 $ cd /path/to/swagger-ui
 $ npm link swagger-client
```

**4. Make sure npm install is not running**

Open `/path/to/swagger-ui/package.json` in your favorite editor and look for `"predev": "npm install"`
script. Temporarily delete this line.

```shell script
 $ cd /path/to/swagger-ui
 $ npm run dev
``` 

You're now running your version of `swagger-client` inside `swagger-ui`. Test
what you need and continue with following step.

**5. Unlink repositories**

We have to clean up after we're done. Open `/path/to/swagger-ui/package.json` 
in your favorite editor and return back the `"predev": "npm install"` script.

```shell script
 $ cd /path/to/swagger-ui
 $ npm unlink --no-save swagger-client
 $ npm install
 $ cd /path/to/swagger-js
 $ npm unlink
```




