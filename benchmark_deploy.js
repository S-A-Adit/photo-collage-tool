// benchmark_deploy.js
// Measures the time taken for the primary deployment steps of the Online Photo Collage project.
// Steps: install dependencies, build client, start server (optional).

const { execSync } = require('child_process');

function runCommand(name, command) {
  console.log(`\n=== Running ${name} ===`);
  console.time(name);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Error during ${name}:`, err.message);
    process.exit(1);
  }
  console.timeEnd(name);
}

// 1. Install all dependencies (client + server)
runCommand('install:all', 'npm run install:all');

// 2. Build the client assets
runCommand('build', 'npm run build');

// 3. (Optional) Start the server – uncomment if you want to include startup time.
// runCommand('start', 'npm start --prefix server');

console.log('\nBenchmark completed.');
