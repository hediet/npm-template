import { GitHub, context } from "@actions/github";
import { exec } from "@actions/exec";
import { readPackageJson } from "./shared";
import { parse } from "semver";

export async function run(): Promise<void> {
	const version = readPackageJson().version;
	if (version.toLowerCase() === "unreleased") {
		console.log("Nothing to release");
		return;
	}

	const semVer = parse(version);
	if (!semVer) {
		throw new Error(`Invalid version "${version}"`);
	}

	let releaseTag: string | undefined = undefined;
	if (semVer.prerelease.length > 0) {
		releaseTag = "" + semVer.prerelease[0];
	}

	await exec("npm", [
		"publish",
		...(releaseTag ? ["--tag", releaseTag] : []),
	]);

	const gitTag = `v${version}`;
	console.log(`Creating a version tag "${gitTag}".`);

	const api = new GitHub(process.env.GH_TOKEN);
	//(await api.repos.updateFile({  })).data.commit.

	const tagRef = `refs/tags/${gitTag}`;
	await api.git.createRef({
		...context.repo,
		ref: tagRef,
		sha: context.sha,
	});

	if (releaseTag !== undefined) {
		const sourceRef = `refs/heads/v${version}`;
		await api.git.createRef({
			...context.repo,
			ref: sourceRef,
			sha: context.sha,
		});

		// TODO: This is not the best way to remove the prerelease part. Build number is missing.
		const newVersion = `${semVer.major}.${semVer.minor}.${semVer.patch}`;
		const newBranch = `releases/v${newVersion}`;
		const targetRef = `refs/heads/${newBranch}`;
		await api.git.createRef({
			...context.repo,
			ref: targetRef,
			sha: context.sha,
		});

		await api.repos.updateFile({
			...context.repo,
			path: "CHANGELOG.md",
			content: Buffer.from("Hello World").toString("base64"),
			message: `Release of version ${newVersion}`,
		});

		await api.pulls.create({
			...context.repo,
			base: newBranch,
			head: targetRef,
			title: `Release ${version} as ${newVersion}`,
		});
	}
}
