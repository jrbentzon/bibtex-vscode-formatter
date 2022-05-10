import * as vscode from 'vscode';
import { BibTeXDocumentFormatter } from './BibTeXDocumentFormatter';
import { BibTeXDocumentRangeFormatter } from './BibTeXDocumentRangeFormatter';

export function activate(ctx: vscode.ExtensionContext) {

	const BIBTEX_LANG: ReadonlyArray<string> = ["bibtex", "BibTeX", "bib"];
	console.log('Activating BibTeX Format Extension');
	vscode.window.showInformationMessage("Activated BibTeX Formatter");

	ctx.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider(BIBTEX_LANG, new BibTeXDocumentFormatter()),
		vscode.languages.registerDocumentRangeFormattingEditProvider(BIBTEX_LANG, new BibTeXDocumentRangeFormatter())
	);

}


// this method is called when your extension is deactivated
export function deactivate() {

}
