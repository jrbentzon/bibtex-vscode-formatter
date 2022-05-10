import * as vscode from 'vscode';
import { BibTeXFormatter } from './BibTeXFormatter';

export class BibTeXDocumentRangeFormatter
	extends BibTeXFormatter
	implements vscode.DocumentRangeFormattingEditProvider {

	public provideDocumentRangeFormattingEdits(
		document: vscode.TextDocument, range: vscode.Range,
		options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] {
		let edits: vscode.TextEdit[] = [];
		for (var i = range.start.line; i <= range.end.line; i++) {
			this.formatLine(document, i, options.insertSpaces).forEach(f => edits.push(f));
			if (token.isCancellationRequested) {
				return [];
			}
		}
		return edits;

	}
}
