import fs from 'fs';

export function loadEnv(path: string) {
  const contents = fs.readFileSync(path, {
    encoding: "utf-8"
  });
  const lines = contents.split('\n');
  for (const line of lines) {
    if (!line.includes('=')) continue;
    const equalsIndex = line.indexOf('=');
    const varName = line.slice(0, equalsIndex);
    const value = line.slice(equalsIndex + 1);
    process.env[varName] = value;
  }
}

