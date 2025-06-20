const config = {
	branches: ["main"],
	repositoryUrl: "git+https://github.com/eyal-test/test11",
	plugins: [
		[
			"@semantic-release/commit-analyzer",
			{
				preset: "angular",
				releaseRules: [
					{ type: "feat", release: "minor" },
					{ type: "fix", release: "patch" },
					{ type: "perf", release: "patch" },
					{ type: "breaking", release: "major" },
				],
			},
		],
		"@semantic-release/release-notes-generator",
		"@semantic-release/changelog",
		["@semantic-release/npm", { npmPublish: false }],
		"@semantic-release/git",
		"@semantic-release/github",
	],
};

module.exports = config;
