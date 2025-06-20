const fs = require("fs");
const crypto = require("crypto");

async function generateGitHubAppToken(appId, privateKeyBase64, installationId) {
	try {
		// Decode the base64 private key
		const privateKey = Buffer.from(privateKeyBase64, "base64").toString("utf8");

		// Create JWT payload
		const now = Math.floor(Date.now() / 1000);
		const payload = {
			iat: now - 60, // Issued at time (60 seconds ago to account for clock skew)
			exp: now + 10 * 60, // Expiration time (10 minutes from now)
			iss: appId, // Issuer (GitHub App ID)
		};

		// Create JWT header
		const header = {
			alg: "RS256",
			typ: "JWT",
		};

		// Encode header and payload
		const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
		const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

		// Create signature
		const signatureInput = `${encodedHeader}.${encodedPayload}`;
		const signature = crypto.sign("RSA-SHA256", Buffer.from(signatureInput), privateKey);
		const encodedSignature = signature.toString("base64url");

		// Create JWT
		const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

		// Get installation access token
		const installationTokenResponse = await fetch(
			`https://api.github.com/app/installations/${installationId}/access_tokens`,
			{
				method: "POST",
				headers: {
					"Authorization": `Bearer ${jwt}`,
					"Accept": "application/vnd.github.v3+json",
					"User-Agent": "GitHub-App-Token-Generator",
				},
			},
		);

		if (!installationTokenResponse.ok) {
			throw new Error(
				`Failed to get installation token: ${installationTokenResponse.status} ${installationTokenResponse.statusText}`,
			);
		}

		const tokenData = await installationTokenResponse.json();
		return tokenData.token;
	} catch (error) {
		console.error("Error generating GitHub App token:", error);
		process.exit(1);
	}
}

// Get parameters from environment variables or command line arguments
const appId = process.env.GITHUB_APP_ID || process.argv[2];
const privateKeyBase64 = process.env.GITHUB_APP_PRIVATE_KEY_BASE64 || process.argv[3];
const installationId = process.env.GITHUB_APP_INSTALLATION_ID || process.argv[4];

if (!appId || !privateKeyBase64 || !installationId) {
	console.error("Usage: node generate-token.js <app-id> <private-key-base64> <installation-id>");
	console.error(
		"Or set environment variables: GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY_BASE64, GITHUB_APP_INSTALLATION_ID",
	);
	process.exit(1);
}

// Generate and output the token
generateGitHubAppToken(appId, privateKeyBase64, installationId)
	.then((token) => {
		// Set as GitHub Actions output if running in GitHub Actions
		if (process.env.GITHUB_OUTPUT) {
			fs.appendFileSync(process.env.GITHUB_OUTPUT, `token=${token}\n`);
		}
	})
	.catch((error) => {
		console.error("Failed to generate token:", error);
		process.exit(1);
	});