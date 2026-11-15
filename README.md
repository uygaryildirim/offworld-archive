# Offworld Archive

**English** · [Türkçe README](./README_TR.md)

An interactive archive of NASA hardware and mission traces left on the Moon and Mars. Offworld Archive combines a dark mission-console interface with a rotatable, terrain-shaped globe built from NASA surface data.

## Features

- Explore a Moon or Mars globe by dragging to rotate and scrolling or using `+ / −` to zoom.
- See recognizable global color mosaics at a distance, then NASA Trek imagery and elevation contours as you zoom in. Local global mosaics and elevation atlases keep the globe available if remote tiles fail.
- Discover major lunar maria and craters, plus Martian landmarks such as Olympus Mons and Valles Marineris, as you approach the surface.
- Browse documented NASA landers, rovers, impact sites, and other surface equipment. Pins follow the mapped surface and disappear beyond the globe’s horizon. Location confidence is stated in each record; approximate sites are identified as such.
- Select one of six Apollo landing-site pins to see the two astronauts who walked there, the landing site, precise coordinates, and a short mission summary. These records use NASA NSSDCA coordinates derived from Lunar Reconnaissance Orbiter imagery.
- Open NASA photographs in record cards, with interactive web 3D models for Apollo Lunar Module, Perseverance, InSight, and Ingenuity where NASA publishes compatible models.
- View a real-star catalog backdrop, subdued planetary labels, and a small orientation globe when zoomed in.
- Start in English; use the `EN / TR` control to switch to Turkish. The preference is saved in the browser.
- The opening screen renders seven high-density dotted Moon spheres from the bundled NASA lunar mosaic and elevation atlas. The sequence starts at first quarter, moves left toward new Moon, sweeps right to full Moon, presents the labeled phases, returns to the half-lit center, then opens the archive. A smaller dotted phase motif remains in the footer mark.
- No server-side API key, Cesium token, or environment variable is required.

## Run locally

Use the included local server, which binds to loopback, disables directory listings, and refuses hidden project files:

```bash
python3 scripts/serve-local.py --port 4173
```

Open [http://localhost:4173](http://localhost:4173). Use `--port 3000` if port 4173 is already in use. Do not open the page with `file://`; the globe loads local assets over HTTP. Close the server with `Ctrl+C` in its terminal.

The global surface mosaics and elevation atlases are bundled in `assets/maps/`. Close-up tiles load from the public NASA Trek WMTS service while the app is running. No token is used.

## Deploy to Vercel

1. Import `uygaryildirim/offworld-archive` from GitHub as a new Vercel project.
2. Select **Other** as the framework preset. Leave Build Command and Output Directory empty.
3. Deploy. No environment variables are needed.

## NASA Space Apps challenge data

The [challenge Resources tab](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources) points to the NASA National Space Science Data Center (NSSDCA) as a core reference. The archive includes its lunar artifact and landing-site records and NASA Mars mission landing sources. A catalog record remains available even when NASA has not published a sufficiently reliable coordinate; in that case the map intentionally shows no pin.

## Sources and attribution

- [NASA Space Apps 2026 challenge resources](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/?tab=resources)
- [NASA NSSDCA lunar artifact and impact locations](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_artifact_impacts.html)
- [NASA NSSDCA Apollo landing coordinates](https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html) — coordinates derived from LRO images.
- [NASA Apollo landing sites and mission context](https://science.nasa.gov/resource/apollo-landing-sites-with-moon-phases/) and [NASA Apollo astronauts](https://www.nasa.gov/the-apollo-program/).
- [NASA Moon Trek](https://trek.nasa.gov/moon/) — LOLA digital elevation and LRO WAC global mosaic.
- [NASA Mars Trek](https://trek.nasa.gov/mars/) — MOLA elevation and Viking color mosaic.
- [NASA Trek WMTS documentation](https://trek.nasa.gov/tiles/apidoc/trekAPI.html) — public close-up map tiles.
- [NASA Images API documentation](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf) — tokenless image search for record cards.
- [NASA 3D Resources](https://science.nasa.gov/3d-resources/) — [Apollo Lunar Module](https://science.nasa.gov/3d-resources/apollo-lunar-module/), [Perseverance](https://science.nasa.gov/3d-resources/mars-2020-perseverance-rover/), [InSight](https://science.nasa.gov/3d-resources/insight-cruise-lander/), and [Ingenuity](https://science.nasa.gov/3d-resources/ingenuity-mars-helicopter/) models.
- [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) — timestamped vectors used by `assets/space-ephemeris.js`.
- [HYG Database v4.1](https://github.com/astronexus/HYG-Database) — star positions, brightness, and color; derived catalog distributed under [CC BY-SA 4.0](https://github.com/astronexus/HYG-Database/blob/master/LICENSE). See [`assets/stars-ATTRIBUTION.txt`](./assets/stars-ATTRIBUTION.txt).

NASA Trek close-up tiles need an internet connection. Rebuild bundled imagery with `node scripts/build-imagery.mjs` and elevation atlases with `node scripts/build-basemaps.mjs`. Refresh the star catalog with `python3 scripts/build-star-catalog.py` or timestamped planetary vectors with `python3 scripts/build-space-ephemeris.py`. These public-source scripts do not require tokens. NASA/JPL and the credited contributors retain ownership of their data; Offworld Archive is an independent project and is not endorsed by NASA.

## Security

This static app uses no secrets. Never commit `.env.local`, `.env`, provider tokens, or other private credentials. If a credential is exposed, revoke it with its provider; removing it from the latest file or commit does not make copies in Git history safe. See [SECURITY.md](./SECURITY.md).
