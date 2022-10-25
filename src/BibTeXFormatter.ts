import * as vscode from 'vscode';
import { capitalizeFirstLetter } from "./capitalizeFirstLetter";
import { deleteLine } from "./deleteLine";

export function stringLeftSpaces(str: string): number {
	return str.length - str.trimLeft().length;
}

export class BibTeXFormatter {

	symbolTargetIndex = 3;
	eqTargetIndex = 14;

	protected formatLine(document: vscode.TextDocument, linenum: number, insertSpaces: boolean = true): vscode.TextEdit[] {

		let edits: vscode.TextEdit[] = [];

		const line = document.lineAt(linenum);
		if (line.text.trim().length === 0) {
			edits.push(deleteLine(document, line.lineNumber));
			return edits;
		}
		let linesymbol = this.getLineSymbol(document, line.lineNumber);
		if (linesymbol.startsWith("@")) {
			edits.push(this.getAuthorYearFormat(document, line.lineNumber));
		}

		if (linesymbol === "author") {
			edits.push(this.formatAuthors(document, line.lineNumber));
		}

		// if (linesymbol === "doi") {
		// 	edits.push(this.cleanDoi(document, line.lineNumber));
		// }

		const eqMarkIndex = line.text.indexOf("=");
		if (eqMarkIndex === -1) { return edits; }
		edits.push(this.appendSpacesBeforeSymbol(line));
		edits.push(this.appendSpacesAfterSymbol(line));
		edits.push(this.capitalizeSymbol(line, eqMarkIndex));
		edits.push(this.appendSpacesAfterEquationMark(line));

		return edits;
	};


	private getAuthorYearFormat(document: vscode.TextDocument, linenum: number) {
		let line = document.lineAt(linenum);
		let author = this.getFirstAuthorLastName(document, linenum);
		let year = this.getYear(document, linenum);
		let authorYear = author + ":" + year;
		let startPos = line.range.start.with({ character: line.text.indexOf("{") + 1 });
		let endPos = line.range.end;
		let edit = vscode.TextEdit.replace(new vscode.Range(startPos, endPos), authorYear + ",");
		return edit;
	}

	private formatAuthors(document: vscode.TextDocument, linenum: number): vscode.TextEdit {
		let line = document.lineAt(linenum);
		let authors = this.getAuthors(document, linenum);
		let newAuthorString = "";
		if (authors.length < 3) {
			newAuthorString = "{" + authors.join(" AND ") + "}";
		} else {
			newAuthorString = "{" + authors.join("\n" + " ".repeat(this.eqTargetIndex + 1) + "AND ") + "}";
		}
		let eqMarkIndex = line.text.indexOf("=");
		let spacesAfterEqMark = stringLeftSpaces(line.text.substring(eqMarkIndex + 1));
		let startPosInd = eqMarkIndex + spacesAfterEqMark + 1;
		let startPos = line.range.start.with({ character: startPosInd });
		let endPos = this.getBlockEndPos(document, startPos);
		return vscode.TextEdit.replace(new vscode.Range(startPos, endPos), newAuthorString);
	}

	private getLineSymbol(document: vscode.TextDocument, linenum: number) {
		let line = document.lineAt(linenum);

		if (line.text.trim().startsWith("@")) {
			return line.text.trim().substring(0, line.text.trim().indexOf("{"));
		}

		let countEquationMarks = line.text.split("=").length - 1;
		if (countEquationMarks !== 1) {
			return "";
		}
		return line.text.split("=")[0].trim().toLowerCase();
	}

	private cleanDoi(document: vscode.TextDocument, linenum: number): vscode.TextEdit {
		const doiPartToRemove = "https://doi.org/";
		let line = document.lineAt(linenum);
		let doiBlock = this.getValueOfNextSymbol(document, line.range.start, "doi");
		let startPosInd = line.text.indexOf("=") + 2;
		let startPos = line.range.start.with({ character: startPosInd });
		let endPos = this.getBlockEndPos(document, startPos);
		let newValue = '{' + doiBlock.replace(doiPartToRemove, "").trim() + "}";
		return vscode.TextEdit.replace(new vscode.Range(startPos, endPos), newValue);
	}

	private appendSpacesBeforeSymbol(line: vscode.TextLine): vscode.TextEdit {
		const currentSpaces = stringLeftSpaces(line.text);
		const nSpaces = this.symbolTargetIndex - currentSpaces;
		if (nSpaces > 0) {
			const insert = " ".repeat(nSpaces);
			return vscode.TextEdit.insert(line.range.start, insert);
		} else {
			return vscode.TextEdit.delete(new vscode.Range(line.range.start, line.range.start.translate({ characterDelta: -nSpaces })));
		}
	}

	private appendSpacesAfterEquationMark(line: vscode.TextLine): vscode.TextEdit {
		const startInd = line.text.indexOf('=') + 1;
		const startPos = line.range.start.with({ character: startInd });
		const currentSpaces = stringLeftSpaces(line.text.substring(startInd));
		const nSpaces = 1 - currentSpaces;
		if (nSpaces > 0) {
			const insert = " ".repeat(nSpaces);
			return vscode.TextEdit.insert(startPos, insert);
		} else {
			return vscode.TextEdit.delete(new vscode.Range(startPos, startPos.translate({ characterDelta: -nSpaces })));
		}
	}

	private capitalizeSymbol(line: vscode.TextLine, eqMarkIndex: number): vscode.TextEdit {
		const symbol = line.text.substring(0, eqMarkIndex);
		const rangeToCap = new vscode.Range(line.range.start, new vscode.Position(line.lineNumber, eqMarkIndex));
		return vscode.TextEdit.replace(rangeToCap, symbol.toUpperCase());
	}

	private appendSpacesAfterSymbol(line: vscode.TextLine): vscode.TextEdit {
		const eqMarkIndex = line.text.indexOf("=");
		const nSpaces = this.eqTargetIndex - eqMarkIndex - (this.symbolTargetIndex - line.firstNonWhitespaceCharacterIndex);

		if (nSpaces > 0) {
			const insert = " ".repeat(nSpaces);
			return vscode.TextEdit.insert(new vscode.Position(line.lineNumber, eqMarkIndex), insert);
		} else {
			return vscode.TextEdit.delete(new vscode.Range(line.lineNumber, eqMarkIndex + nSpaces, line.lineNumber, eqMarkIndex));
		}

	}

	private getFirstAuthorLastName(document: vscode.TextDocument, linenum: number): string {
		let authors = this.getAuthors(document, linenum);
		if (authors.length > 0) {
			return authors[0].split(",")[0];
		}

		return "";
	}

	private capitalizeAuthors(author: string): string {
		return author.split(",")
			.map(n => n
				.split(" ")
				.map(sn => capitalizeFirstLetter(sn.trimLeft()))
				.join(" ").trim())
			.join(", ");
	}

	private getAuthors(document: vscode.TextDocument, linenum: number): string[] {
		let authors = this.getValueOfNextSymbol(document, document.lineAt(linenum).range.start, "author");
		return authors
			.toLowerCase()
			.split(/\band\b/)
			.map(a => this.capitalizeAuthors(a.trim()));
	}

	private getNextBlock(document: vscode.TextDocument, startPos: vscode.Position): string {

		let text = document.getText(new vscode.Range(startPos, document.lineAt(document.lineCount - 1).range.end));
		let nextQuotationMark = text.indexOf('"');
		let nextOpeningBracket = text.indexOf('{');
		nextQuotationMark = nextQuotationMark === -1 ? Number.MAX_VALUE : nextQuotationMark + startPos.character;
		nextOpeningBracket = nextOpeningBracket === -1 ? Number.MAX_VALUE : nextOpeningBracket + startPos.character;

		let qualifier = nextQuotationMark > nextOpeningBracket ? "Bracket" : "Quote";
		let blockText = "";
		switch (qualifier) {
			case "Quote": {
				let startInd = document.lineAt(startPos).range.start.with({ character: nextQuotationMark });
				blockText = this.getQuotedBlock(document, startInd);
				break;
			}
			case "Bracket": {
				let startInd = document.lineAt(startPos).range.start.with({ character: nextOpeningBracket });
				blockText = this.getBlock(document, startInd);
				break;
			}
		}
		return blockText;
	}


	private getYear(document: vscode.TextDocument, linenum: number): string {
		return this.getValueOfNextSymbol(document, document.lineAt(linenum).range.start, "year");
	}

	private getValueOfNextSymbol(document: vscode.TextDocument, startPos: vscode.Position, symbol: string): string {
		for (let i = startPos.line; i < document.lineCount; i++) {
			let line = document.lineAt(i);
			if (line.text.toLowerCase().includes(symbol.toLowerCase())) {
				return this.getNextBlock(document, line.range.start.with({ character: line.text.indexOf("=") + 1 }));
			}
		}
		return "";
	}

	private getQuotedBlock(document: vscode.TextDocument, startPos: vscode.Position): string {
		let endPos = document.lineAt(document.lineCount - 1).range.end;
		let searchRange = new vscode.Range(startPos, endPos);
		let text = document.getText(searchRange);
		let i = startPos.character;
		while (i < text.length) {
			let char = text[i];
			if (char === '"') {
				break;
			}
			i++;
		}
		endPos = startPos.with({ character: i });
		text = document
			.getText(new vscode.Range(startPos, endPos))
			.replace("\n", "").trim();
		return text.substring(1, text.length - 1);
	}

	private getBlock(document: vscode.TextDocument, startPos: vscode.Position): string {
		let endPos = this.getBlockEndPos(document, startPos);
		let text = document
			.getText(new vscode.Range(startPos, endPos))
			.replace("\n", "").trim();
		return text.substring(1, text.length - 1);
	}

	private getBlockEndPos(document: vscode.TextDocument, startPos: vscode.Position): vscode.Position {
		let startOffset = document.offsetAt(startPos);

		let text = document.getText();
		let i = startOffset + 1;
		let depth = 1;
		while (i < text.length && depth > 0) {
			let char = text[i];
			if (char === "{") {
				depth++;
			} else if (char === "}") {
				depth--;
			}
			i++;
		}
		let endPos = document.positionAt(i);
		return endPos;
	}
}
