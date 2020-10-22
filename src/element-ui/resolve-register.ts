import * as vscode from 'vscode';
type EndOfLineString = '\n' | '\r\n';

export class ResolveRegister {
    private eol: EndOfLineString;
    constructor(private document: vscode.TextDocument, private component: string) {
        this.eol = this.document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
    }
    import() {

    }
    async register() {
        const edit = await this.getTextEdit();
        vscode.workspace.applyEdit(edit);
    }
    async getTextEdit() {
        let edit = new vscode.WorkspaceEdit();
        let text = this.document.getText();
        text = this.resolveImport(text);
        text = await this.resolveRegister(text);
        edit.replace(this.document.uri, new vscode.Range(0, 0, this.document.lineCount, 0), text);
        return edit;
    }

    private resolveImport(text: string) {
        const importExp = /(?:import\ \{)((?:.|\n)*)(?:\}\ from\ '@ks\/ks-element-ui')/;
        const foundImport = text.match(importExp);
        if (foundImport) {
            const exp = /(\w+)/g;
            const importedComps = [];
            let match;
            while(match = exp.exec(foundImport[1])) {
                importedComps.push(match[1]);
            }
            if (importedComps.includes(this.component)) { return text; }
            importedComps.push(this.component);
            const importStatement = `import {\n\t${importedComps.join(',\n\t')}\n} from '@ks/ks-element-ui'`;
            text = text.replace(importExp, importStatement);
        } else {
            text = this.createImport(text);
        }
        return text;
    }
    private createImport(text: string) {
        const scriptTag = `${this.eol}<script>${this.eol}`;
        const scriptTagExp = new RegExp(scriptTag);
        const scriptTagMatch = text.match(scriptTagExp);
        if (!scriptTagMatch) { return text; }

        const importStatement = `import {\n\t${this.component}\n} from '@ks/ks-element-ui';\n`;
        text = text.replace(scriptTagExp, `${scriptTag}${importStatement}`);
        return text;
    }

    private async resolveRegister(text: string) {
        const componentsExp = /components: ?\{([^}]*)\},?/;
        const foundComponents = text.match(componentsExp);
        if (foundComponents) {
            const exp = /\w+(: ?\w+)?/g;
            const componentList: string[][] = [];
            let match;
            while(match = exp.exec(foundComponents[1])) {
                componentList.push(match[0].split(/: ?/));
            }
            if (componentList.find(([, component]) => component === this.component)) {
                return text;
            }
            componentList.push([ `El${this.component}`, this.component ]);
            text = text.replace(componentsExp, this.createRegisterStatement(componentList));
        } else {
            const startOptionExp = /export\s*default\s*(defineComponent\s*?\()?\s*\{/;
            let match = startOptionExp.exec(text);
            if (!match) {
                vscode.window.showWarningMessage('[Fast Coding]Can not find proper position for components option.');
                return text;
            }
            const registerStatement = this.createRegisterStatement([ [`El${this.component}`, this.component] ]);
            let insertIndex = match.index + match[0].length;

            while(/\s/.test(text[insertIndex])) {
                insertIndex++;
            }

            console.log(text[insertIndex]);
            if (text[insertIndex] === '}') {
                text = text.replace(/(export\s*default\s*(?:defineComponent\s*?\()?\s*\{)(\s*)\}/, (m, p1, p2) => {
                    return `${p1}${this.eol}\t${registerStatement}${this.eol}}`;
                });
            } else {
                const firstLine = this.document.lineAt(this.document.positionAt(insertIndex));
                if (firstLine.text.match(/name:/)) {
                    text = text.replace(/(name:\s*['"][\w-]*['"]),?/, m0 => {
                        const res = `${m0}${this.eol}\t${registerStatement}${this.eol}`;
                        return res;
                    });
                } else {
                    text = text.replace(/export\s*default\s*(?:defineComponent\s*?\()?\s*\{/, m0 => {
                        return `${m0}${this.eol}\t${registerStatement}${this.eol}`
                    });
                }
            }
        }
        return text;
    }
    private createRegister(text: string) {
        
    }
    private createRegisterStatement(componentList: string[][]) {
        const componentListString = componentList
            .map(([registerName, componentName]) => `${registerName}${componentName ? `: ${componentName}` : ''},`)
            .join(`${this.eol}\t\t`);
        return `components: {${this.eol}\t\t${componentListString}${this.eol}\t},`;
    }
}
