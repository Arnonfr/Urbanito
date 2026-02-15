const variants = [
    { name: "Random + Flux", url: `https://image.pollinations.ai/prompt/random${Math.random()}?model=flux` },
    { name: "Random + Turbo", url: `https://image.pollinations.ai/prompt/random${Math.random()}?model=turbo` },
    { name: "Random (No Model)", url: `https://image.pollinations.ai/prompt/random${Math.random()}` },
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
