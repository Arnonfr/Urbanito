const prompt = "A beautiful historic street in Paris with cobblestones and old buildings";
const truncatedPrompt = prompt.substring(0, 500);
const enhancedPrompt = `historical photography, 8k resolution, highly detailed, cinematic lighting, photorealistic: ${truncatedPrompt}`;
const encodedPrompt = encodeURIComponent(enhancedPrompt);
const seed = Math.floor(Math.random() * 1000000);
const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=576&seed=${seed}&nologo=true`;

console.log("Generated URL:", url);

// Optional: Try fetching it (requires fetch in Node environment)
fetch(url).then(res => {
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get('content-type'));
    if (res.ok) {
        console.log("Success! Image generated.");
    } else {
        console.log("Failed! Status:", res.status);
    }
}).catch(err => {
    console.error("Fetch Error:", err);
});
