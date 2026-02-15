const complexUrl = "https://image.pollinations.ai/prompt/Vintage%20photo%20of%20A%20beautiful%20historic%20street?nologo=true&seed=123";
const simpleUrl = "https://image.pollinations.ai/prompt/historic%20city%20street?nologo=true&seed=123";

async function verifyFix() {
    console.log("1. Testing Complex URL (expecting 530)...");
    try {
        const res1 = await fetch(complexUrl);
        console.log(`   Status: ${res1.status}`);
        if (res1.status !== 200) console.log("   -> Blocked as expected.");
    } catch (e) {
        console.log("   -> Fetch failed.");
    }

    console.log("2. Testing Simple Fallback URL (expecting 200)...");
    try {
        const res2 = await fetch(simpleUrl);
        console.log(`   Status: ${res2.status}`);
        if (res2.status === 200) console.log("   -> Fallback works!");
        else console.log(`   -> Fallback failed with ${res2.status}`);
    } catch (e) {
        console.log("   -> Fallback fetch failed.");
    }
}

verifyFix();
