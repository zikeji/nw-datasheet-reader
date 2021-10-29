import {promises as fs} from 'fs';
import {globby} from 'globby';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import {extract, convert} from './datasheets/extract-and-convert.mjs';

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node nw-datasheet-reader.mjs OUTPUT_FORMAT "PATH_TO_PAKS"');
    console.log('Example: node nw-datasheet-reader.mjs csv "C:/Program Files (x86)/Steam/steamapps/common/New World Closed Beta"');
    process.exit();
}

let outputFormat = args[0].toLowerCase();
const validOutputFormats = ['csv', 'json'];
if (!validOutputFormats.includes(outputFormat)) {
    console.log(`Invalid output format. Supported: ${validOutputFormats.join(', ')}`);
    process.exit(1);
}

let assetsPath = args[1].replace(/"/g, '').replace(/\\/g, '/');

if (assetsPath.endsWith('/')) {
    assetsPath = assetsPath.slice(0, -1);
}

const recursePak = async (path) => {
    let files = [];
    for (const file of (await fs.readdir(path))) {
        const info = await fs.stat(join(path, file));
        if (info.isDirectory()) {
            files = [...files, ...(await recursePak(join(path, file)))];
        } else if (file.endsWith('.pak')) {
            files.push(join(path, file));
        }
    }
    return files;
}

const pakFilePaths = await recursePak(assetsPath);

const outPath = dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/') + '/out/';
await fs.mkdir(outPath, {recursive: true});

await extract(pakFilePaths, outPath);
// await convert(outPath, outputFormat);
