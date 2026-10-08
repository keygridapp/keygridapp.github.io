# Keygrid website

The website for [Keygrid](https://github.com/ChrisCollins24/Keygrid), served free by GitHub Pages at https://keygridapp.github.io.

- `index.html`: the landing page
- `app/`: Keygrid in the browser, at https://keygridapp.github.io/app
- `404.html`: the "page not found" page
- `img/`: images, icons and fonts

## Updating the browser version

`app/index.html` is built from the Mac app's own interface and analysis code, so both versions stay the same. After changing the app, rebuild it with:

```
node tools/build-web-app.js <path to the Keygrid app repository>
```
