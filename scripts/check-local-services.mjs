import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync(new URL('../.env', import.meta.url))) {
  console.error('Missing .env file. Copy .env.example to .env before starting the apps.');
  process.exit(1);
}

const docker = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], { encoding: 'utf8' });
if (docker.status !== 0) {
  console.error('Docker daemon is unavailable to this user. Start Docker and grant access to its socket, or start PostgreSQL and Redis separately.');
  process.exit(2);
}

const compose = spawnSync('docker', ['compose', 'ps', '--format', 'json'], { encoding: 'utf8' });
if (compose.status !== 0) {
  console.error('Docker Compose could not inspect the project services.');
  process.exit(2);
}

console.log('Docker daemon is reachable. Start services with: npm run dev:infra');
