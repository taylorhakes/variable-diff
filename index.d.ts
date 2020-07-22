export = diff;

declare function diff(left: any, right: any, options?: DiffOptions): {
	changed: boolean;
	text: string;
};

interface DiffOptions {
	indent?: string;
	newLine?: string;
	wrap?: (type: string, text: string) => string;
	color?: boolean;
}
