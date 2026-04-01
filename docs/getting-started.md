# Getting Started

**visc-line** can work in any JavaScript environment, including Node.js, Deno, Bun and browsers. To get started, you need to install the library and import it into your project.

## For Node.js

To work with Node.js, you must have version 18 or higher installed.

Check your Node.js version with the following command:

```sh
node -v
```

If you do not have Node.js installed in your current environment, or the installed version is too low, you can use [nvm](https://github.com/nvm-sh/nvm) to install the latest version of Node.js.

## Install with CDN

You can also include **visc-line** in your project using a CDN. Add the following script tag to your HTML file:

```html
<script src="https://cdn.jsdelivr.net/npm/visc-line/dist/index.umd.js"></script>
```

## Create a new project using package manager

Navigate to the folder where your project will be created and run the following command to create a new directory:

```sh
mkdir app && cd app
```

Initialize a `package.json` file using one of the following commands:

<!-- tabs:start -->

#### **npm**

```sh
npm init
```

#### **pnpm**

```sh
pnpm init
```

#### **yarn**

```sh
yarn init
```

#### **bun**

```sh
bun init
```

#### **deno**

```sh
deno init
```

<!-- tabs:end -->

### Install Dependencies

Install `visc-line` using your preferred package manager:

<!-- tabs:start -->

#### **npm**

```sh
npm install visc-line
```

#### **pnpm**

```sh
pnpm add visc-line
```

#### **yarn**

```sh
yarn add visc-line
```

#### **bun**

```sh
bun add visc-line
```

#### **deno**

```sh
deno add --npm visc-line
```

<!-- tabs:end -->
