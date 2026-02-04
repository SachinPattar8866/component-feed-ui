const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

async function build() {
  const inputPath = path.resolve(__dirname, '../src/index.css');
  const outDir = path.resolve(__dirname, '../tmp');
  const outPath = path.join(outDir, 'tailwind-output.css');

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const css = fs.readFileSync(inputPath, 'utf8');

  try {
    const plugins = [
      require('autoprefixer')(),
    ];

    const result = await postcss(plugins).process(css, { from: inputPath });
    fs.writeFileSync(outPath, result.css, 'utf8');
    console.log('Wrote output to', outPath);
  } catch (err) {
    console.error('PostCSS build error:', err);
    process.exit(1);
  }
}

build();
