const prompt = "A beautiful historic street in Paris with cobblestones and old buildings";

// Same logic as in geminiService.ts
const safePrompt = prompt.replace(/[^\w\s,]/gi, '').substring(0, 100);
const simpleEnhancedPrompt = `Vintage photo of ${safePrompt}`;
const encodedPrompt = encodeURIComponent(simpleEnhancedPrompt);
const seed = Math.floor(Math.random() * 1000);
const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&seed=${seed}`;

console.log("Testing URL:", url);

async function checkUrl() {
    try {
        const response = await fetch(url);
        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);
        if (!response.ok) {
            console.log("Response Body:", await response.text());
        } else {
            console.log("Success! Image generated.");
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

checkUrl();
