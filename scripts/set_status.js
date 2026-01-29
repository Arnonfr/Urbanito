const fs = require('fs');
const path = require('path');

const DASHBOARD_DATA_FILE = path.join(__dirname, '../dashboard_data.json');

const handle = process.argv[2];
const status = process.argv[3] || 'active'; // active, idle, busy
const task = process.argv[4] || 'Updated via command';

if (!handle) {
    console.error('Usage: node scripts/set_status.js <handle> <status> [task]');
    process.exit(1);
}

if (!fs.existsSync(DASHBOARD_DATA_FILE)) {
    console.error('Data file not found.');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DASHBOARD_DATA_FILE, 'utf8'));

let found = false;
data.agents = data.agents.map(a => {
    if (a.handle === handle) {
        a.status = status;
        a.lastUpdate = task;
        found = true;
    }
    return a;
});

if (found) {
    fs.writeFileSync(DASHBOARD_DATA_FILE, JSON.stringify(data, null, 4));
    console.log(`✅ Updated ${handle} to ${status}: ${task}`);
} else {
    console.error(`❌ Handle ${handle} not found.`);
}
