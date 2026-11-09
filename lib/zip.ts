import { ZipArchive } from 'archiver';
import * as path from 'path';
import * as fsp from 'fs/promises';

/**
 * Helper to recursively collect all file paths relative to a root directory.
 */
async function collectRelativeFiles(dir: string, baseRel: string = '', exclude: string[] = []): Promise<string[]> {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries) {
    if (entry.name.endsWith('.zip') || entry.name === 'manifest.json' || exclude.includes(entry.name)) continue;
    const rel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await collectRelativeFiles(full, rel, exclude);
      result.push(...sub);
    } else if (entry.isFile()) {
      result.push(rel);
    }
  }
  return result;
}

/**
 * Create a ZIP archive stream from all files in a job's tmp directory.
 * Streams the ZIP directly (no buffering entire archive in memory).
 *
 * @param jobId - The job ID
 * @returns A readable stream of the ZIP archive and the number of files included
 */
export async function createZipStream(jobId: string): Promise<{
  stream: ZipArchive;
  fileCount: number;
}> {
  const jobDir = path.join(process.cwd(), 'tmp', jobId);

  // Verify the directory exists
  let stats;
  try {
    stats = await fsp.stat(jobDir);
  } catch {
    throw new Error(`Job directory not found: ${jobDir}`);
  }

  if (!stats.isDirectory()) {
    throw new Error(`Job path is not a directory: ${jobDir}`);
  }

  const files = await collectRelativeFiles(jobDir);

  if (files.length === 0) {
    throw new Error(`No files found in job directory: ${jobDir}`);
  }

  // Create ZipArchive instance with moderate compression
  const archive = new ZipArchive({ zlib: { level: 5 } });

  // Handle archiver warnings (e.g. stat failures)
  archive.on('warning', (err: any) => {
    if (err && err.code === 'ENOENT') {
      console.warn(`[zip] Warning for job ${jobId}:`, err.message);
    } else {
      throw err;
    }
  });

  // Handle archiver errors
  archive.on('error', (err: any) => {
    throw err;
  });

  // Add each file to the archive
  for (const relName of files) {
    const filePath = path.join(jobDir, relName);
    archive.file(filePath, { name: relName.replace(/\\/g, '/') });
  }

  // Finalize the archive (signals that no more files will be appended)
  archive.finalize();

  return {
    stream: archive,
    fileCount: files.length,
  };
}

/**
 * Creates and writes a ZIP archive of a directory to a destination file path.
 */
export async function createZipFile(
  sourceDir: string,
  destFilePath: string,
): Promise<void> {
  const fs = await import('fs');
  const files = await collectRelativeFiles(sourceDir);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destFilePath);
    const archive = new ZipArchive({ zlib: { level: 5 } });

    let finished = false;
    const onDone = () => {
      if (!finished) {
        finished = true;
        resolve();
      }
    };

    output.on('close', onDone);
    output.on('finish', onDone);
    archive.on('error', (err) => reject(err));

    archive.pipe(output);

    for (const relName of files) {
      archive.file(path.join(sourceDir, relName), { name: relName.replace(/\\/g, '/') });
    }
    archive.finalize();
  });
}

/**
 * Creates an in-memory ZIP buffer of all image/screenshot files in a directory.
 */
export async function createZipBufferFromDir(sourceDir: string): Promise<Buffer> {
  const files = await collectRelativeFiles(sourceDir);

  return new Promise<Buffer>((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 5 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', (err: any) => reject(err));

    for (const relName of files) {
      archive.file(path.join(sourceDir, relName), { name: relName.replace(/\\/g, '/') });
    }
    archive.finalize();
  });
}


/**
 * Stream a ZIP of every file in `dir` (recursively), skipping names in `exclude`.
 * Returns null when there is nothing to zip.
 */
export async function createZipStreamFromDir(dir: string, exclude: string[] = []): Promise<ZipArchive | null> {
  const files = await collectRelativeFiles(dir, '', exclude);
  if (files.length === 0) return null;
  const archive = new ZipArchive({ zlib: { level: 5 } });
  for (const relName of files) {
    archive.file(path.join(dir, relName), { name: relName.replace(/\\/g, '/') });
  }
  archive.finalize();
  return archive;
}

/** Wrap an archiver stream as a Web ReadableStream for a Response body. */
export function toWebStream(archive: ZipArchive): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      archive.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      archive.on('end', () => controller.close());
      archive.on('error', (err: Error) => controller.error(err));
    },
  });
}
