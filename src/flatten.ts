export type JSONObject = { [key: string]: JSONValue | undefined };
export interface JSONArray extends Array<JSONValue> {}
export type JSONValue =
	| string
	| number
	| boolean
	| null
	| JSONObject
	| JSONArray;

function flatten(val: JSONValue): Record<string, string> {
	return new FlattenToStringKVPairs().flatten(val);
}

function unflatten(val: Record<string, string>): JSONValue {
	return new FlattenToStringKVPairs().unflatten(val);
}

// \forall x: JSONValue: deep_equal(unflatten(flatten(x)), x)

assert_equals(flatten({}), {
	":": "{}",
});

assert_equals(flatten([]), {
	":": "[]",
});

assert_equals(flatten([1]), {
	"[0]:num": "1",
});

assert_equals(flatten(["1"]), {
	"[0]": "1",
});

assert_equals(flatten([{}]), {
	"[0]:": "{}",
});

asset_equals(
	flatten({
		uri:
			"vscode-userdata:/c%3A/Users/henni/AppData/Roaming/Code/User/settings.json",
		start: { col: 8, line: 148 },
		end: { col: 20, line: 148 },
	}),
	{
		uri:
			"vscode-userdata:/c%3A/Users/henni/AppData/Roaming/Code/User/settings.json",
		"start.line:num": "148",
		"start.col:num": "8",
		"end.line:num": "148",
		"end.col:num": "20",
	}
);


export  type PathItem = {
    kind: "field";
    name: string;
} | {
    kind: "index"
    index: number;
}

export class FlattenedEntry {
	constructor(public readonly path: PathItem[], public readonly value: JSONValue) {}

	toString(): string {
		return new FlattenedEntryParser().toString(this).join(": ");
	}
}

export class Flattener {
	public flatten(value: JSONValue): FlattenedEntry[] {
		if (typeof value === "object" && value) {
			if (Array.isArray(value)) {
				const result = new Array<FlattenedEntry>();
				let index = 0;
				for (const item of value) {
					for (const itemFlattened of this.flatten(item)) {
						itemFlattened.path.unshift({ kind: "index", index })
						result.push(itemFlattened);
					}
					index++;
				}
			} else {

			}
		} else {
			return [new FlattenedEntry([], value)];
		}
	}
	
	public unflatten(value: FlattenedEntry[]): JSONValue {
		let result: { kind: "array", val: JSONArray } | { kind: "obj", val: JSONObject} | { kind: "primitive", val: JSONValue } | undefined;
		for (const item of value) {
			if (item.path.length === 0) {
				result = { kind: "primitive", val: item.value }
			} else {

			}
		}

		if (!result) {
			throw new Error("Invalid input");
		}
		return result.val;
	}
}



export class FlattenedEntryParser {
	public parse(pair: [string, string]): FlattenedEntry {
    
	}

	public toString(entry: FlattenedEntry): [string, string] {

	}
}



export class FlattenToStringKVPairs {

	public readonly parser: FlattenedEntryParser;
	public readonly flattener: Flattener;

	constructor(options: { parser?: FlattenedEntryParser, flattener?: Flattener } = {}) {
		this.parser = options.parser || new FlattenedEntryParser();
		this.flattener = options.flattener || new Flattener();
	}
	
	public flatten(value: JSONValue): Record<string, string> {
		const entries = this.flattener.flatten(value);
		const result: Record<string, string> = {};
		for (const entry of entries) {
			const [key, value] = this.parser.toString(entry);
			result[key] = value;
		}
		return result;
	}
	
	public unflatten(value: Record<string, string>): JSONValue {
		const entries = Object.entries(value).map(kv => this.parser.parse(kv));
		return this.flattener.unflatten(entries);
	}
}

