import { GitHub, context } from "@actions/github";
import { readPackageJson } from "./shared";
import { parse } from "semver";
import { getChangelog } from "./set-version-from-changelog";

export async function run(): Promise<void> {
	const version = readPackageJson().version;
	const semVer = parse(version);
	if (!semVer) {
		throw new Error(`Invalid version "${version}"`);
	}

	if (semVer.prerelease.length === 0) {
		throw new Error(
			`Cannot release directly! Use a prerelease version first!`
		);
	}

	const api = new GitHub(process.env.GH_TOKEN);
	const sourceBranch = `pending-releases/v${version}`;
	const sourceRef = `refs/heads/${sourceBranch}`;
	await api.git.createRef({
		...context.repo,
		ref: sourceRef,
		sha: context.sha,
	});

	// TODO: This is not the best way to remove the prerelease part. Build number is missing.
	const newVersion = `${semVer.major}.${semVer.minor}.${semVer.patch}`;
	const targetBranch = `releases/v${newVersion}`;
	const targetRef = `refs/heads/${targetBranch}`;

	await api.git.createRef({
		...context.repo,
		ref: targetRef,
		sha: context.sha,
	});

	const d = (
		await api.repos.getContents({
			...context.repo,
			path: "CHANGELOG.md",
			ref: sourceRef,
		})
	).data;
	if (Array.isArray(d)) {
		throw new Error();
	}

	const changelog = getChangelog();
	changelog.setLatestVersion(newVersion);

	await api.repos.createOrUpdateFile({
		...context.repo,
		path: "CHANGELOG.md",
		branch: sourceBranch,
		sha: d.sha,
		content: Buffer.from(changelog.toString()).toString("base64"),
		message: `Release of version ${newVersion}`,
	});

	await api.pulls.create({
		...context.repo,
		base: targetBranch,
		head: sourceBranch,
		title: `Release ${version} as ${newVersion}`,
	});
}
