import * as ts from 'typescript';
import * as _ts from '../../ts-internal';

import { ReferenceType } from '../../models/types/index';
import { Context } from '../context';

/**
 * Create a new reference type pointing to the given symbol.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param symbol  The symbol the reference type should point to.
 * @param includeParent  Should the name of the parent be provided within the fallback name?
 * @returns A new reference type instance pointing to the given symbol.
 */
export function createReferenceType(context: Context, symbol: ts.Symbol, includeParent?: boolean): ReferenceType {
    const checker = context.checker;
    const id      = context.getSymbolID(symbol);
    let name    = checker.symbolToString(symbol);

    if (includeParent && symbol.parent) {
        name = checker.symbolToString(symbol.parent) + '.' + name;
    }

    return new ReferenceType(name, id);
}

/**
 * Create a new reference type pointing to the given import type node.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node  The import type node the reference type should point to.
 * @param resolvedSymbol The symbol that the node's type was resolved to.
 * @returns A new reference type instance pointing to the given import type node.
 */
export function createJSDocReferenceType(context: Context, node: ts.ImportTypeNode, resolvedSymbol: ts.Symbol?): ReferenceType {
    const name = node.qualifier.getText();
    const literal = ((node.argument as ts.LiteralTypeNode).literal as ts.LiteralExpression);
    const file = _ts.getResolvedModule(_ts.getSourceFileOfNode(node), literal.text).resolvedFileName;
    const sourceFileObject = context.program.getSourceFile(file);

    if (resolvedSymbol && _ts.getSourceFileOfNode(resolvedSymbol.valueDeclaration) === sourceFileObject) {
        return createReferenceType(context, resolvedSymbol);
    }

    const symbol = sourceFileObject.symbol.exports.get(ts.escapeLeadingUnderscores(name));
    const id = context.getSymbolID(symbol);

    return new ReferenceType(name, id);
}
