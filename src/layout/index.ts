export const containerLayout = {
	columns: `16dpx 1 16dpx`,
	rows: `1`,
	areas: {
		control: { row: 0, column: 1 },
	},
};

export const controlLayout = {
	columns: `1 1 1 1 1`,
	rows: `16dpx 32dpx 16dpx 32dpx 16dpx 32dpx 16dpx 32dpx 16dpx 32dpx 16dpx 16dpx 4dpx 1 32dpx 4dpx 64dpx 8dpx`,
	areas: {
		measure: { row: 1, column: 0, columnSpan: 5 },
		recognize: { row: 3, column: 0, columnSpan: 5 },
		breakLongText: { row: 5, column: 0, columnSpan: 2 },
		topmost: { row: 7, column: 0, columnSpan: 2 },
		zh: { row: 9, column: 0, columnSpan: 2 },
		en: { row: 9, column: 2, columnSpan: 2 },
		fontSizeLabel: { row: 11, column: 0 },
		fontSize: { row: 11, column: 1, columnSpan: 3 },
		fontSizeValue: { row: 11, column: 4 },
		snow: { row: 16, column: 4 },
	},
};