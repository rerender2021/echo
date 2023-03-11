export const containerLayout = {
	columns: `16dpx 1 16dpx`,
	rows: `1`,
	areas: {
		control: { row: 0, column: 1 },
	},
};

export const controlLayout = {
	columns: `1`,
	rows: `16dpx 32dpx 16dpx 32dpx 16dpx 32dpx 16dpx 32dpx 4dpx 1 32dpx 4dpx 150dpx`,
	areas: {
		measure: { row: 1, column: 0 },
		recognize: { row: 3, column: 0 },
		punct: { row: 5, column: 0 },
		topmost: { row: 7, column: 0 },
	},
};
