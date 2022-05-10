import * as vscode from 'vscode';
import { BibTeXFormatter } from './BibTeXFormatter';

export class BibTeXDocumentFormatter
	extends BibTeXFormatter
	implements vscode.DocumentFormattingEditProvider {

	provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
		let edits: vscode.TextEdit[] = [];
		for (var i = 0; i < document.lineCount; i++) {
			this.formatLine(document, i, options.insertSpaces).forEach(f => edits.push(f));
			if (token.isCancellationRequested) {
				return [];
			}
		}
		return edits;
	}
}
