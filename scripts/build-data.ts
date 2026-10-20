import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';

type Row = Record<string, string>;

type Term = {
	id: number;
	term: string;
	acronym: string;
	definition: string;
	domain: number;
	category: string;
	added: string;
	retired: string;
};

const LOCK = 'data/ids.txt';
const OUTPUT = 'src/lib/server/terms.json';

const errors: string[] = [];
const warnings: string[] = [];

function parseLine(line: string): string[] {
	const fields: string[] = [];
	let field = '';
	let quoted = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (quoted) {
			if (c === '"' && line[i + 1] === '"') {
				field += '"';
				i++;
			} else if (c === '"') {
				quoted = false;
			} else {
				field += c;
			}
		} else if (c === '"') {
			quoted = true;
		} else if (c === ',') {
			fields.push(field);
			field = '';
		} else {
			field += c;
		}
	}
	fields.push(field);
	return fields;
}

function readCsv(path: string): Row[] {
	const lines = readFileSync(path, 'utf8').split('\n');
	const header = parseLine(lines[0].trim());
	const rows: Row[] = [];
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (line === '') continue;
		const fields = parseLine(line);
		if (fields.length !== header.length) {
			errors.push(`${path} line ${i + 1}: expected ${header.length} fields, got ${fields.length}`);
			continue;
		}
		const row: Row = {};
		for (let j = 0; j < header.length; j++) {
			row[header[j]] = fields[j].trim();
		}
		rows.push(row);
	}
	return rows;
}

function isDate(text: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
	const date = new Date(text);
	return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

function countLetters(term: string): number {
	return term.replace(/ /g, '').length;
}

function acronymFits(acronym: string, term: string): boolean {
	const letters = term.toUpperCase().replace(/[^A-Z0-9]/g, '');
	const wanted = acronym.toUpperCase().replace(/[^A-Z0-9]/g, '');
	if (letters[0] !== wanted[0]) return false;
	let j = 0;
	for (let i = 0; i < letters.length && j < wanted.length; i++) {
		if (letters[i] === wanted[j]) j++;
	}
	return j === wanted.length;
}

function leakedWords(term: string, definition: string): string[] {
	const found: string[] = [];
	const termWords = term.toUpperCase().split(/[ .\/-]/);
	const defWords = definition.toUpperCase().split(/[^A-Z0-9]+/);
	for (const word of termWords) {
		if (word.length >= 4 && defWords.includes(word)) found.push(word);
	}
	return found;
}

function readLock(): Map<number, string> {
	const lock = new Map<number, string>();
	if (!existsSync(LOCK)) return lock;
	const lines = readFileSync(LOCK, 'utf8').split('\n');
	for (const line of lines) {
		if (line.trim() === '') continue;
		lock.set(Number(line.split('|')[0]), line.trim());
	}
	return lock;
}

const categories = new Map<string, string>();
for (const row of readCsv('data/objectives.csv')) {
	categories.set(row.objective, `${row.objective} ${row.name}`);
}

const lock = readLock();
const terms: Term[] = [];
const seenIds = new Set<number>();
const seenTerms = new Set<string>();
const newLockLines: string[] = [];

for (const row of readCsv('data/terms.csv')) {
	const where = `ID ${row.id} (${row.term})`;
	const id = Number(row.id);

	if (!/^[1-9][0-9]*$/.test(row.id)) errors.push(`${where}: ID must be a positive whole number`);
	if (seenIds.has(id)) errors.push(`${where}: duplicate ID`);
	if (seenTerms.has(row.term.toUpperCase())) errors.push(`${where}: duplicate term`);
	if (!/^[A-Za-z0-9.\/-]+( [A-Za-z0-9.\/-]+)*$/.test(row.term)) {
		errors.push(`${where}: term can only use letters, digits, - . / and single spaces`);
	}
	if (countLetters(row.term) > 40) errors.push(`${where}: term is longer than 40 tiles`);
	if (row.acronym !== '' && !/^[A-Za-z0-9.\/&-]+$/.test(row.acronym)) {
		errors.push(`${where}: bad acronym`);
	}
	if (row.definition === '') errors.push(`${where}: missing definition`);
	if (!categories.has(row.objective)) errors.push(`${where}: unknown objective ${row.objective}`);
	if (row.reviewed !== 'yes' && row.reviewed !== 'no')
		errors.push(`${where}: reviewed must be yes or no`);
	if (!isDate(row.added)) errors.push(`${where}: added must be a YYYY-MM-DD date`);
	if (row.retired !== '' && !isDate(row.retired)) {
		errors.push(`${where}: retired must be empty or a YYYY-MM-DD date`);
	}

	const lockLine = `${row.id}|${row.term}|${row.added}`;
	if (!lock.has(id)) {
		newLockLines.push(lockLine);
	} else if (lock.get(id) !== lockLine) {
		errors.push(`${where}: term or added date changed, lock has "${lock.get(id)}"`);
	}

	if (row.acronym !== '' && !acronymFits(row.acronym, row.term)) {
		warnings.push(`${where}: acronym ${row.acronym} does not match the term`);
	}
	const leaked = leakedWords(row.term, row.definition);
	if (leaked.length > 0) warnings.push(`${where}: definition gives away ${leaked.join(', ')}`);

	seenIds.add(id);
	seenTerms.add(row.term.toUpperCase());
	terms.push({
		id: id,
		term: row.term,
		acronym: row.acronym,
		definition: row.definition,
		domain: Number(row.objective.split('.')[0]),
		category: categories.get(row.objective) ?? '',
		added: row.added,
		retired: row.retired
	});
}

for (const id of lock.keys()) {
	if (!seenIds.has(id)) errors.push(`ID ${id} was removed, set retired instead`);
}

for (const warning of warnings) console.warn(`warning: ${warning}`);

if (errors.length > 0) {
	for (const error of errors) console.error(`error: ${error}`);
	process.exit(1);
}

if (newLockLines.length > 0) appendFileSync(LOCK, newLockLines.join('\n') + '\n');
writeFileSync(OUTPUT, JSON.stringify(terms));
console.log(`Built ${terms.length} terms, ${newLockLines.length} new`);
