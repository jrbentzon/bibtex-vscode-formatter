import * as vscode from 'vscode';


export function deleteLine(document: vscode.TextDocument, linenum: number): vscode.TextEdit {
	const line = document.lineAt(linenum);

	if (document.lineCount === linenum + 1) {
		return vscode.TextEdit.delete(line.range);
	}

	const nextLine = document.lineAt(linenum + 1);

	const rangeToDelete = new vscode.Range(line.range.start, nextLine.range.start);
	return vscode.TextEdit.delete(rangeToDelete);
}
