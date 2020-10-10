import * as vscode from 'vscode';
import { ELEMENT_COMPONENTS, AUTO_REGISTER_COMPONENT_COMMAND } from './config';
import { ResolveRegister } from "./resolve-register";

export class ElementCompletion implements vscode.CompletionItemProvider {
    constructor(private context: vscode.ExtensionContext) {
        const autoRegister = vscode.commands.registerCommand(AUTO_REGISTER_COMPONENT_COMMAND, ({ document, component }) => {
            new ResolveRegister(document, component).register();
        });
        context.subscriptions.push(autoRegister);
    }

    public provideCompletionItems(document: vscode.TextDocument) {
        return ELEMENT_COMPONENTS.map(component => {
            const completion = new vscode.CompletionItem(`ele${component}`, vscode.CompletionItemKind.Text);
            completion.detail = `[fast-coding] import and register ${component}`;
            completion.documentation = `[fast-coding] import and register ${component}`;
            completion.insertText = '';
            completion.command = {
                command: AUTO_REGISTER_COMPONENT_COMMAND,
                title: 'Auto register element-ui component',
                arguments: [{ document, component }]
            };
            return completion;
        });
    }
}

