const variants = [
    { name: "Cat (Again)", url: "https://image.pollinations.ai/prompt/cat" },
    { name: "Dog", url: "https://image.pollinations.ai/prompt/dog" },
    { name: "Tree", url: "https://image.pollinations.ai/prompt/tree" },
    { name: "Random String", url: `https://image.pollinations.ai/prompt/random${Math.random()}` },
    { name: "Random Seed Cat", url: `https://image.pollinations.ai/prompt/cat?seed=${Math.floor(Math.random() * 1000)}` },
    { name: "Model: Flux", url: "https://image.pollinations.ai/prompt/cat?model=flux" },
    { name: "Model: Turbo", url: "https://image.pollinations.ai/prompt/cat?model=turbo" },
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
