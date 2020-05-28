import { GitHub, context } from "@actions/github";
import { exec } from "@actions/exec";
import { readPackageJson } from "./shared";

export async function run(args: string[]): Promise<void> {
	let pubArgs = "";
	let releaseTag: string | undefined = "";
	if (args.length === 1) {
		releaseTag = args[0];
		pubArgs = ` --tag ${releaseTag}`;
	}

	let failedDueToAlreadyPublished = false;
	const resultStatus = await exec(`npm publish${pubArgs}`, [], {
		ignoreReturnCode: true,
		listeners: {
			errline: (line) => {
				if (
					line.indexOf(
						"cannot publish over previously published version"
					) !== -1
				) {
					failedDueToAlreadyPublished = true;
				}
			},
		},
	});
	if (resultStatus !== 0) {
		if (failedDueToAlreadyPublished) {
			console.log(
				"This version has already been published. A version tag will not be created."
			);
			return;
		} else {
			throw new Error("npm publish failed.");
		}
	}

	const version = readPackageJson().version;
	const gitTag = `v${version}${releaseTag ? `-${releaseTag}` : ""}`;
	console.log(`Creating a version tag "${gitTag}".`);

	const api = new GitHub(process.env.GH_TOKEN);
	const tagRef = `refs/tags/${gitTag}`;
	await api.git.createRef({
		...context.repo,
		ref: tagRef,
		sha: context.sha,
	});

	if (releaseTag !== undefined) {
		const branchRef = `refs/heads/${gitTag}`;
		await api.git.createRef({
			...context.repo,
			ref: branchRef,
			sha: context.sha,
		});

		await api.pulls.create({
			base: "release",
			...context.repo,
			title: `Release Version ${version}`,
			head: branchRef,
		});
	}
}
