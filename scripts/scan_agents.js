const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../.agent/skills');
const OUTPUT_FILE = path.join(__dirname, '../AGENTS_INDEX.md');
const HTML_OUTPUT = path.join(__dirname, '../dashboard.html');

// Define explicit metadata for our known agents to ensure they look perfect
const AGENT_METADATA = {
    'product-manager': {
        name: 'Product Manager',
        handle: '@ProductManager',
        icon: 'briefcase',
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    'frontend-developer': {
        name: 'Frontend Developer',
        handle: '@Frontend',
        icon: 'layout',
        color: 'text-pink-600',
        bg: 'bg-pink-50'
    },
    'ui-ux-designer': {
        name: 'UI/UX Designer',
        handle: '@UIUX',
        icon: 'palette',
        color: 'text-purple-600',
        bg: 'bg-purple-50'
    },
    'urban-guide': {
        name: 'Urban Guide',
        handle: '@UrbanGuide',
        icon: 'map',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
    },
    'supabase-expert': {
        name: 'Supabase Expert',
        handle: '@Supabase',
        icon: 'database',
        color: 'text-green-600',
        bg: 'bg-green-50'
    },
    'script-writer': {
        name: 'Script Writer',
        handle: '@ScriptWriter',
        icon: 'mic',
        color: 'text-amber-600',
        bg: 'bg-amber-50'
    },
    'prompt-engineering': {
        name: 'Prompt Engineer',
        handle: '@Prompt',
        icon: 'terminal',
        color: 'text-slate-600',
        bg: 'bg-slate-50'
    },
    'ux-researcher-designer': {
        name: 'UX Researcher',
        handle: '@UXResearch',
        icon: 'search',
        color: 'text-rose-600',
        bg: 'bg-rose-50'
    },
    'information-architect': {
        name: 'Info Architect',
        handle: '@InfoArchitect',
        icon: 'git-merge',
        color: 'text-cyan-600',
        bg: 'bg-cyan-50'
    }
};

console.log(`🔍 Scanning directory: ${SKILLS_DIR}`);

if (!fs.existsSync(SKILLS_DIR)) {
    console.error('❌ Skills directory not found!');
    process.exit(1);
}

const agents = [];
const dirs = fs.readdirSync(SKILLS_DIR);

dirs.forEach(dir => {
    if (dir.startsWith('.')) return;

    // Use our metadata mapping, or fall back to directory name
    const meta = AGENT_METADATA[dir] || {
        name: dir,
        handle: '@' + dir,
        icon: 'bot',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
    };

    let skillPath = path.join(SKILLS_DIR, dir, 'SKILL.md');
    let description = 'Ready for instructions';
    let fullContent = '';

    if (fs.existsSync(skillPath)) {
        fullContent = fs.readFileSync(skillPath, 'utf8');
        const descMatch = fullContent.match(/description:\s*(.*)/);
        if (descMatch) description = descMatch[1].trim();
    }

    agents.push({
        id: dir,
        name: meta.name,
        handle: meta.handle,
        icon: meta.icon,
        color: meta.color,
        bg: meta.bg,
        description: description,
        fullSkill: fullContent, // Store full content
        path: skillPath
    });
});

// Prepare data for HTML injection
if (fs.existsSync(HTML_OUTPUT)) {
    let htmlContent = fs.readFileSync(HTML_OUTPUT, 'utf8');

    const jsAgents = agents.map(a => ({
        role: a.name,
        handle: a.handle,
        status: 'active',
        currentTask: 'Waiting for tasks',
        lastUpdate: a.description,
        fullSkill: a.fullSkill, // Pass it through
        icon: a.icon,
        color: a.color,
        bg: a.bg
    }));

    const replacement = `const activeAgents = ${JSON.stringify(jsAgents, null, 4)};`;
    const regex = /const activeAgents = \[([\s\S]*?)\];/;

    if (regex.test(htmlContent)) {
        htmlContent = htmlContent.replace(regex, replacement);
        fs.writeFileSync(HTML_OUTPUT, htmlContent);
        console.log(`🖥️  Dashboard HTML data updated.`);
    }
}

// ALSO UPDATE THE JSON DATA SOURCE for live polling
const JSON_OUTPUT = path.join(__dirname, '../dashboard_data.json');
const jsonData = {
    activeTask: "System Synced",
    agents: agents.map(a => ({
        handle: a.handle,
        role: a.name,
        status: 'idle', // Default to idle on scan
        currentTask: 'Ready',
        lastUpdate: a.description,
        fullSkill: a.fullSkill,
        icon: a.icon,
        color: a.color,
        bg: a.bg
    }))
};

// If file exists, try to preserve status
if (fs.existsSync(JSON_OUTPUT)) {
    try {
        const existing = JSON.parse(fs.readFileSync(JSON_OUTPUT, 'utf8'));
        // Map existing statuses to new scan
        jsonData.agents = jsonData.agents.map(newAgent => {
            const oldAgent = existing.agents.find(ea => ea.handle === newAgent.handle);
            if (oldAgent) {
                newAgent.status = oldAgent.status;
                newAgent.currentTask = oldAgent.currentTask;
                newAgent.lastUpdate = oldAgent.lastUpdate;
            }
            return newAgent;
        });
    } catch (e) { console.log('Error reading existing JSON, overwriting.'); }
}

fs.writeFileSync(JSON_OUTPUT, JSON.stringify(jsonData, null, 4));
console.log(`💾 dashboard_data.json updated with ${jsonData.agents.length} agents.`);
