import { UserProfile } from "./interface";
import { redirectToAuthCodeFlow, getAccessToken } from "./authPkec";

const clientId = import.meta.env.CLIENT_ID ?? ""; // Way to get env data when vite is used
const params = typeof window !== undefined ? new URLSearchParams(window.location.search) : undefined;
const code = params?.get('code') ?? "";

console.log(params);
console.log(code);
if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken: string = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    console.log(`Profile: ${profile}`);
    populateUI(profile);
}

// Get client profile data
async function fetchProfile(token: string): Promise<UserProfile> {
    // TODO: Call Web API
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

// Ready to show view data
function populateUI(profile: UserProfile): void {
    // TODO: Update UI with profile data
    document.getElementById("displayName")!.innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar")!.appendChild(profileImage);
    }

    // view data set by profile info
    document.getElementById("id")!.innerText = profile.id;
    document.getElementById("email")!.innerText = profile.email;
    document.getElementById("uri")!.innerText = profile.uri;
    document.getElementById("uri")!.setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url")!.innerText = profile.href;
    document.getElementById("url")!.setAttribute("href", profile.href);
    document.getElementById("imgUrl")!.innerText = profile.images[0]?.url ?? '(no profile image)';
}