import * as fs from 'fs';
import * as path from 'path';

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function writeTimestampedJsonReport<T>(
  reportDir: string,
  filePrefix: string,
  report: T,
  timestamp: Date = new Date()
): string {
  ensureDir(reportDir);
  const filename = `${filePrefix}_${timestamp.toISOString().replace(/[:.]/g, '-')}.json`;
  const outPath = path.join(reportDir, filename);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  return outPath;
}

export function writeTextReport(reportPath: string, content: string): void {
  ensureDir(path.dirname(reportPath));
  fs.writeFileSync(reportPath, content);
}
