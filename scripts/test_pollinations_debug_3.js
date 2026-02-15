const variants = [
    { name: "Single Word", url: "https://image.pollinations.ai/prompt/street" },
    { name: "Two Words (Space)", url: `https://image.pollinations.ai/prompt/${encodeURIComponent("historic street")}` },
    { name: "Two Words (Hyphen)", url: "https://image.pollinations.ai/prompt/historic-street" },
    { name: "Two Words (Underscore)", url: "https://image.pollinations.ai/prompt/historic_street" },
    { name: "Two Words (+)", url: "https://image.pollinations.ai/prompt/historic+street" },
    { name: "Encoded Space %20", url: "https://image.pollinations.ai/prompt/historic%20street" },
    { name: "Short Sentence", url: `https://image.pollinations.ai/prompt/${encodeURIComponent("A street in Paris")}` },
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
