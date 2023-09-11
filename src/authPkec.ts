// Authorize client data
export async function redirectToAuthCodeFlow(clientId: string) {
    // TODO: Redirect to Spotify authorization page
    if (typeof localStorage === "undefined") {
        throw new Error("Can not use loacalStoarge in this browser.");
    }

    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    // Set code verifier to localStorage
    localStorage.setItem("verifier", verifier);

    // Get params
    const params = new URLSearchParams();

    // Append client info to HTML DOM
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    // Re-Set location for authorizing
    if (typeof window !== "undefined") {
        // window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    }
}

// Get access token for authorizing
export async function getAccessToken(clientId: string, code: string): Promise<string> {
    // TODO: Get access token for code
    const verifier = localStorage.getItem("verifier");
    if (verifier === "" || verifier === undefined) {
        throw new Error("Verifier is not valid");
    }

    const params = new URLSearchParams();
    console.log(`[getAccessToken] params: ${params}`);

    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier!);

    const result: Response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

// For handling PKEC
function generateCodeVerifier(randomLength: number): string {
    const possibleChars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let generatedString = "";
    for (let index = 0; index < randomLength; index++) {
        generatedString += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    }
    return generatedString;
}

async function generateCodeChallenge(codeVerifier: string) {
    const encoder: TextEncoder = new TextEncoder();
    const data: Uint8Array = encoder.encode(codeVerifier);
    if (typeof window !== "undefined") {
        const digest: ArrayBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }
    return "";
}