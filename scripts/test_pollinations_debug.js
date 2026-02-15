const variants = [
    { name: "Simple Prompt", url: "https://image.pollinations.ai/prompt/cat" },
    { name: "With Width/Height", url: "https://image.pollinations.ai/prompt/cat?width=1024&height=576" },
    { name: "With Seed", url: "https://image.pollinations.ai/prompt/cat?seed=123" },
    { name: "With NoLogo", url: "https://image.pollinations.ai/prompt/cat?nologo=true" },
    { name: "Full Params (Simple Prompt)", url: "https://image.pollinations.ai/prompt/cat?width=1024&height=576&seed=123&nologo=true" },
    { name: "Long Prompt (No Params)", url: `https://image.pollinations.ai/prompt/${encodeURIComponent("historical photography, 8k resolution, highly detailed, cinematic lighting, photorealistic: A beautiful historic street in Paris with cobblestones and old buildings")}` },
    { name: "Long Prompt (Full Params)", url: `https://image.pollinations.ai/prompt/${encodeURIComponent("historical photography, 8k resolution, highly detailed, cinematic lighting, photorealistic: A beautiful historic street in Paris with cobblestones and old buildings")}?width=1024&height=576&seed=123&nologo=true` },
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
