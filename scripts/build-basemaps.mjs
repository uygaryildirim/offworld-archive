import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

// Static 4K x 2K atlas for the interactive globe: no live tile/API requests in the deployed app.
const zoom = 3;
const columns = 2 ** (zoom + 1);
const rows = 2 ** zoom;
const outputDir = new URL('../assets/maps/', import.meta.url);
const workDir = await mkdtemp(join(tmpdir(), 'offworld-map-'));

const layers = [
  {planet: 'Moon', key: 'moon', kind: 'elevation', id: 'LRO_LOLA_DEM_Global_128ppd_v04', ext: 'png', out: 'moon-height.png'},
  {planet: 'Mars', key: 'mars', kind: 'elevation', id: 'Mars_MGS_MOLA_DEM_mosaic_global_463m_8', ext: 'png', out: 'mars-height.png'}
];

async function fetchTile(layer, x, y) {
  const url = `https://trek.nasa.gov/tiles/${layer.planet}/EQ/${layer.id}/1.0.0/default/default028mm/${zoom}/${y}/${x}.${layer.ext}`;
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {headers: {Accept: 'image/*'}});
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${layer.id}/${y}/${x}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) throw new Error(`Empty tile: ${layer.id}/${y}/${x}`);
      const file = join(workDir, layer.key, layer.kind, String(y), `${x}.${layer.ext}`);
      await mkdir(join(workDir, layer.key, layer.kind, String(y)), {recursive: true});
      await writeFile(file, bytes);
      return file;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function runPool(tasks, concurrency = 8) {
  const results = new Array(tasks.length);
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor++;
      results[index] = await tasks[index]();
    }
  }
  await Promise.all(Array.from({length: concurrency}, worker));
  return results;
}

try {
  await mkdir(outputDir, {recursive: true});
  for (const layer of layers) {
    const tasks = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) tasks.push(() => fetchTile(layer, x, y));
    }
    const tiles = await runPool(tasks);
    const out = new URL(layer.out, outputDir);
    const args = ['montage', ...tiles, '-tile', `${columns}x${rows}`, '-geometry', '256x256+0+0'];
    if (layer.kind === 'elevation') args.push('-colorspace', 'Gray', '-depth', '8', '-define', 'png:compression-level=9');
    else args.push('-quality', '88', '-sampling-factor', '4:2:0');
    args.push(out.pathname);
    const result = spawnSync('magick', args, {encoding: 'utf8'});
    if (result.status !== 0) throw new Error(result.stderr || `ImageMagick failed for ${layer.out}`);
    const stat = await readFile(out);
    console.log(`${layer.out}: ${(stat.length / 1024).toFixed(0)} KB`);
  }
} finally {
  await rm(workDir, {recursive: true, force: true});
}
