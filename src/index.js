import { PassThrough } from 'stream';
import yargs from 'yargs';
import fs from 'fs';
import { resolve as resolvePath, parse as parsePath, dirname } from 'path';
import { homedir } from 'os';
import { promisifyAll } from 'bluebird';

if (process.stdout.isTTY) {
  const {
    argv: {
      input,
      output,
    } = {},
  } = yargs
  .usage('$0 [options]')
  .options({
    input: {
      alias: 'i',
      describe: `Base64 encoded file.
  `,
      type: 'string',
      required: true,
    },
    output: {
      alias: 'o',
      describe: `Output directory or file to write decoded contents to.
  WARNING: Will overwrite files.`,
      type: 'string',
      required: true,
    },
  }).help(
    'help',
    `Show help.
  `);

  const getRelativePath = path => (
    resolvePath(
      process.cwd(),
      path.replace(/^~/, homedir()),
    )
  );

  const {
    statAsync,
    accessAsync,
    constants: {
      R_OK,
      W_OK,
    },
    readFileAsync,
    writeFileAsync,
  } = promisifyAll(fs);

  (async () => {
    // Get relative paths
    const inputFilePath = getRelativePath(input);
    let outputFilePath = getRelativePath(output);

    try {
      // Check if input is a file
      const inputFileStats = await statAsync(inputFilePath);
      if (!inputFileStats.isFile()) throw new Error('Input is not a file.');

      // Check if input is readable
      try {
        await accessAsync(inputFilePath, R_OK);
      } catch (err) {
        throw new Error('Input file does not have read permissions or is unreadable.');
      }
    } catch (err) {
      throw err;
    }

    try {
      // Check if output is a file or directory
      // If output is a directory use the input filename as the output file name
      try {
        const outputFileStats = await statAsync(outputFilePath);
        if (outputFileStats.isDirectory()) {
          const { base: inputFileBase } = parsePath(inputFilePath);
          outputFilePath = resolvePath(outputFilePath, inputFileBase);
        }
      } catch (err) {
        // do nothing
      }

      await statAsync(dirname(outputFilePath));
    } catch (err) {
      throw new Error('Output path is not a file or a directory.');
    }

    // Check if output is a writable file
    // try {
    //   console.log(outputFilePath);
    //   await accessAsync(outputFilePath, W_OK);
    // } catch (err) {
    //   throw new Error('Output file does not have write permissions.');
    // }

    console.log(outputFilePath);

    // Read input file, decode it, and write to output file
    const file = await readFileAsync(inputFilePath, { encoding: 'ascii' });
    await writeFileAsync(outputFilePath, Buffer.from(file, 'base64'));
  })().catch(
    err => {
      console.error(err); // eslint-disable-line no-console
      process.exit(1);
    },
  );
} else {
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  let allData = '';

  process.stdin.on('data', newData => {
    allData += newData;
  });

  process.stdin.on('end', () => {
    const bufStream = new PassThrough();
    bufStream.end(Buffer.from(allData, 'base64'));
    bufStream.pipe(process.stdout);
  });
}
