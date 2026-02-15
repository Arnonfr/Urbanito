const variants = [
    { name: "Medium Prompt (50 chars)", url: `https://image.pollinations.ai/prompt/${encodeURIComponent("A beautiful historic street in Paris with sunlight")}` },
    { name: "Long Prompt (100 chars)", url: `https://image.pollinations.ai/prompt/${encodeURIComponent("A beautiful historic street in Paris with cobblestones and old buildings and sunlight and people walking")}` },
    { name: "Longer Prompt (200 chars)", url: `https://image.pollinations.ai/prompt/${encodeURIComponent("historical photography, 8k resolution, highly detailed, cinematic lighting, photorealistic: A beautiful historic street in Paris with cobblestones and old buildings and sunlight and people walking around")}` },
    { name: "Prompt with Nologo (Safe?)", url: `https://image.pollinations.ai/prompt/${encodeURIComponent("A beautiful historic street in Paris")}?nologo=true` },
    { name: "Prompt with Seed (Unsafe?)", url: `https://image.pollinations.ai/prompt/${encodeURIComponent("A beautiful historic street in Paris")}?seed=123` },
];

async function testAll() {
    for (const v of variants) {
        try {
            const res = await fetch(v.url);
            console.log(`[${v.name}] Status: ${res.status}`);
            if (!res.ok) console.log(`   URL: ${v.url}`);
        } catch (e) {
            console.error(`[${v.name}] Error: ${e.message}`);
        }
    }
}

testAll();
