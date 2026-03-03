import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function htmlToPdf(opts: {
  chromePath: string;
  inputFileUrl: string;
  outputPdfPath: string;
}) {
  const { chromePath, inputFileUrl, outputPdfPath } = opts;
  await execFileAsync(chromePath, [
    '--headless',
    '--disable-gpu',
    '--no-margins',
    `--print-to-pdf=${outputPdfPath}`,
    inputFileUrl
  ]);
}
