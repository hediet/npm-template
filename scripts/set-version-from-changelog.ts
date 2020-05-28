import { writeFileSync } from "fs";
import { join } from "path";
import { readPackageJson, readTextFileSync } from "./shared";

export async function run(_args: string[]): Promise<void> {
	const changelog = readTextFileSync(join(__dirname, "../CHANGELOG.md"));
	const result = /## \[(.*\..*\..*)\]/.exec(changelog);
	const recentVersion = result[1];

	const packageJson = readPackageJson();
	packageJson.version = recentVersion;

	writeFileSync(
		join(__dirname, "../package.json"),
		JSON.stringify(packageJson, undefined, 4),
		{ encoding: "utf-8" }
	);
}
