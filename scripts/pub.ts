import { GitHub, context } from "@actions/github";
import { exec } from "@actions/exec";
import { readPackageJson } from "./shared";
import * as stream from "stream";

export class StringStream extends stream.Writable {
	constructor() {
		super();
		stream.Writable.call(this);
	}

	private contents = "";

	_write(
		data: string | Buffer | Uint8Array,
		encoding: string,
		next: Function
	): void {
		this.contents += data;
		next();
	}

	getContents(): string {
		return this.contents;
	}
}

export async function run(args: string[]): Promise<void> {
	let pubArgs = "";
	let releaseTag: string | undefined = "";
	if (args.length === 1) {
		releaseTag = args[0];
		pubArgs = ` --tag ${releaseTag}`;
	}

	await exec(`npm publish${pubArgs}`, [], {
		ignoreReturnCode: true,
		listeners: {
			stdout: (data) => {
				// is not called.
				console.log("stdout:", data);
			},
			errline: (line) => {
				// is not called.
				console.log("errline: ", line);
			},
			stdline: (line) => {
				console.log("stdline: ", line);
			},
		},
	});

	return;

	let failedDueToAlreadyPublished = false; //npm publish${pubArgs}
	const s = new StringStream();
	const resultStatus = await exec("node --eval 'console.log(`test`)'", [], {
		ignoreReturnCode: true,
		outStream: s,
		listeners: {
			stdout: (data) => {
				console.log(data);
			},
			errline: (line) => {
				console.log("err: ", line);
				if (
					line.indexOf(
						"cannot publish over previously published version"
					) !== -1
				) {
					failedDueToAlreadyPublished = true;
				}
			},
			stdline: (line) => {
				console.log("bla ", line);
			},
		},
	});
	console.log(s.getContents());
	return;
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
