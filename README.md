# Renwick Apparel & Textiles — website

Static site. Upload everything to the repo root; GitHub Pages serves `index.html`.

```
index.html
assets/css/site.css        all styles (phone layout under 760px)
assets/js/site.js          collections, price estimator, size guide, FAQ, menu, phone dock
assets/js/viewer.min.js    3D jersey viewer (three.js bundled in). Loaded only when you scroll near it.
assets/3d/                 jersey artwork + heightmap used to build the 3D jersey
src/viewer.js              readable source of the viewer (not used by the site directly)
```

## The 3D jersey

The jersey in "02 — Spin it" is a real 3D mesh. It is built in the browser from `assets/3d/height.png`
(the Windstrike silhouette turned into a puffed front and back surface) and wrapped with
`assets/3d/front.webp` and `assets/3d/back.webp`.

**To use a proper modelled jersey instead:** export it as a `.glb`, upload it (for example to
`assets/3d/jersey.glb`) and set `data-model="assets/3d/jersey.glb"` on the `.viewer` element in
`index.html`. If the file is missing or fails to load, the site falls back to the built-in jersey.
If the browser has no WebGL, it shows the flat photos and the Front/Side/Back buttons still work.

## Rebuilding the viewer (only if you edit src/viewer.js)

```
npm i three esbuild
npx esbuild src/viewer.js --bundle --minify --format=iife --outfile=assets/js/viewer.min.js
```

After any update, bump the `?v=` number on the CSS/JS links in `index.html` so phones load the new files.
