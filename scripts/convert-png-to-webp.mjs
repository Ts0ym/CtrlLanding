import fs from "node:fs/promises";
import path from "node:path";

let sharp;

try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.error(
    "Не удалось загрузить sharp. Установи его командой: npm install -D sharp",
  );
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    target: "public",
    quality: 82,
    effort: 6,
    recursive: true,
    force: false,
    deleteSource: false,
    lossless: false,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) {
      options.target = arg;
      continue;
    }

    if (arg === "--force") options.force = true;
    else if (arg === "--delete-source") options.deleteSource = true;
    else if (arg === "--lossless") options.lossless = true;
    else if (arg === "--no-recursive") options.recursive = false;
    else if (arg.startsWith("--quality=")) {
      options.quality = Number(arg.split("=")[1]);
    } else if (arg.startsWith("--effort=")) {
      options.effort = Number(arg.split("=")[1]);
    }
  }

  if (!Number.isFinite(options.quality) || options.quality < 1 || options.quality > 100) {
    throw new Error("`--quality` должен быть числом от 1 до 100.");
  }

  if (!Number.isFinite(options.effort) || options.effort < 0 || options.effort > 6) {
    throw new Error("`--effort` должен быть числом от 0 до 6.");
  }

  return options;
}

function isConvertibleImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".png" || ext === ".jpg" || ext === ".jpeg";
}

async function collectImageFiles(targetPath, recursive) {
  const stat = await fs.stat(targetPath);

  if (stat.isFile()) {
    return isConvertibleImage(targetPath) ? [targetPath] : [];
  }

  const files = [];
  const entries = await fs.readdir(targetPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(targetPath, entry.name);

    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...await collectImageFiles(entryPath, recursive));
      }
      continue;
    }

    if (entry.isFile() && isConvertibleImage(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function convertFile(filePath, options) {
  const outputPath = filePath.replace(/\.(png|jpe?g)$/i, ".webp");

  if (!options.force) {
    try {
      await fs.access(outputPath);
      return { status: "skipped", input: filePath, output: outputPath };
    } catch {
      // output does not exist
    }
  }

  const inputStat = await fs.stat(filePath);

  await sharp(filePath)
    .rotate()
    .webp({
      quality: options.quality,
      effort: options.effort,
      lossless: options.lossless,
      smartSubsample: !options.lossless,
    })
    .toFile(outputPath);

  const outputStat = await fs.stat(outputPath);

  if (options.deleteSource) {
    await fs.unlink(filePath);
  }

  return {
    status: "converted",
    input: filePath,
    output: outputPath,
    inputSize: inputStat.size,
    outputSize: outputStat.size,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const targetPath = path.resolve(process.cwd(), options.target);
  const files = await collectImageFiles(targetPath, options.recursive);

  if (!files.length) {
    console.log(`PNG/JPG файлы не найдены: ${targetPath}`);
    return;
  }

  let convertedCount = 0;
  let skippedCount = 0;
  let totalInputSize = 0;
  let totalOutputSize = 0;

  for (const filePath of files) {
    const result = await convertFile(filePath, options);

    if (result.status === "skipped") {
      skippedCount += 1;
      console.log(`skip  ${path.relative(process.cwd(), result.output)}`);
      continue;
    }

    convertedCount += 1;
    totalInputSize += result.inputSize;
    totalOutputSize += result.outputSize;

    console.log(
      `done  ${path.relative(process.cwd(), result.output)}  ${formatBytes(result.inputSize)} -> ${formatBytes(result.outputSize)}`,
    );
  }

  const saved = Math.max(0, totalInputSize - totalOutputSize);

  console.log("");
  console.log(`Готово. Конвертировано: ${convertedCount}, пропущено: ${skippedCount}`);
  if (convertedCount > 0) {
    console.log(
      `Размер: ${formatBytes(totalInputSize)} -> ${formatBytes(totalOutputSize)} (экономия ${formatBytes(saved)})`,
    );
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
