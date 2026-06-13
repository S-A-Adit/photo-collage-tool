import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, 'test_images');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

async function run() {
  await sharp({
    create: {
      width: 300,
      height: 200,
      channels: 4,
      background: '#ff0000'
    }
  }).png().toFile(path.join(dir, 'test1.png'));

  await sharp({
    create: {
      width: 400,
      height: 300,
      channels: 4,
      background: '#0000ff'
    }
  }).png().toFile(path.join(dir, 'test2.png'));

  console.log('Test images generated successfully in:', dir);
}

run().catch(console.error);
