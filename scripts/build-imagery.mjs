import {mkdir, rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const worlds = {
  moon: 'Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02',
  mars: 'Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m'
};
const z = 2, cols = 2 ** (z + 1), rows = 2 ** z, out = path.join(root, 'assets/maps');
await mkdir(out, {recursive:true});
for (const [world, layer] of Object.entries(worlds)) {
  const dir = path.join(out, `${world}-tiles-z${z}`);
  await rm(dir, {recursive:true, force:true}); await mkdir(dir, {recursive:true});
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const tile = path.join(dir, `${String(y).padStart(2,'0')}-${String(x).padStart(2,'0')}.jpg`);
    const url = `https://trek.nasa.gov/tiles/${layer}/1.0.0/default/default028mm/${z}/${y}/${x}.jpg`;
    execFileSync('curl', ['--fail', '--silent', '--show-error', '--location', '--retry', '2', url, '--output', tile], {stdio:'inherit'});
  }
  const inputs = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) inputs.push(path.join(dir, `${String(y).padStart(2,'0')}-${String(x).padStart(2,'0')}.jpg`));
  execFileSync('magick', ['montage', ...inputs, '-tile', `${cols}x${rows}`, '-geometry', '256x256+0+0', '-quality', '88', path.join(out, `${world}-color.jpg`)], {stdio:'inherit'});
  await rm(dir, {recursive:true, force:true});
  console.log(`Built ${world} basemap (${cols*256}×${rows*256})`);
}
