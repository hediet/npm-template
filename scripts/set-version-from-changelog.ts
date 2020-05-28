import { writeFileSync } from "fs";
import { join } from "path";
import { readPackageJson, readTextFileSync } from "./shared";

export async function run(): Promise<void> {
	const packageJson = readPackageJson();
	packageJson.version = getChangelog().latestVersion;

	writeFileSync(
		join(__dirname, "../package.json"),
		JSON.stringify(packageJson, undefined, 4),
		{ encoding: "utf-8" }
	);
}

export function getChangelog(): Changelog {
	return new Changelog(readTextFileSync(join(__dirname, "../CHANGELOG.md")));
}

export class Changelog {
	public get latestVersion(): string {
		const result = /## \[(.*?)\]/.exec(this.src);
		return result[1];
	}

	constructor(private src: string) {}

	public setLatestVersion(newVersion: string): void {
		this.src = this.src.replace(/## \[(.*?)\]/, `## [${newVersion}]`);
	}

	public toString(): string {
		return this.src;
	}
}
