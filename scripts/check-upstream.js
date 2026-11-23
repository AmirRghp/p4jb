import { execSync } from 'node:child_process';

console.log('Fetching latest commits from upstream (GamerHack)...');
try {
  execSync('git fetch upstream', { stdio: 'inherit' });
  const count = execSync('git rev-list --count main..upstream/main', { encoding: 'utf8' }).trim();
  if (count === '0') {
    console.log('✅ You are completely up to date with upstream! (0 commits behind)');
  } else {
    console.log(`⚠️ Upstream has ${count} new commit(s):`);
    const log = execSync('git log --oneline main..upstream/main', { encoding: 'utf8' });
    console.log(log);
    console.log('To sync, see docs/DEPLOYMENT.md or run the upstream sync steps.');
  }
} catch (err) {
  console.error('Failed to check upstream:', err.message);
  process.exit(1);
}
