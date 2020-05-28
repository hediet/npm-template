import { GitHub, context } from "@actions/github";
import { exec } from "@actions/exec";
import { readPackageJson } from "./shared";

export async function run(args: string[]): Promise<void> {
	let pubArgs = "";
	let tag: string | undefined = "";
	if (args.length === 1) {
		tag = args[0];
		pubArgs = ` --tag ${tag}`;
	}

	const resultStatus = await exec(`npm publish${pubArgs}`, [], {
		ignoreReturnCode: true,
	});
	if (resultStatus !== 0) {
		console.log("Publish failed. A version tag will not be created.");
		return;
	}
	const version = readPackageJson().version;
	const gitTag = `v${version}${tag ? `-${tag}` : ""}`;
	console.log(`Creating a version tag "${gitTag}".`);

	const api = new GitHub(process.env.GH_TOKEN);
	const r = await api.git.createTag({
		...context.repo,
		tag: gitTag,
		object: context.sha,
		type: "commit",
		message: gitTag,
	});
	console.log(r);
}
