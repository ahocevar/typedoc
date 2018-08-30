import * as ts from 'typescript';
import * as _ts from '../../ts-internal';

import { Reflection, ReflectionKind, DeclarationReflection } from '../../models/index';
import { createDeclaration } from '../factories/index';
import { Context } from '../context';
import { Component, ConverterNodeComponent } from '../components';

@Component({name: 'node:jsdoc-typedef'})
export class JSDocTypedefConverter extends ConverterNodeComponent<ts.JSDocTypedefTag> {
    /**
     * List of supported TypeScript syntax kinds.
     */
    supports: ts.SyntaxKind[] = [
        ts.SyntaxKind.JSDocTypedefTag
    ];

    /**
     * Analyze the given type alias declaration node and create a suitable reflection.
     *
     * @param context  The context object describing the current state the converter is in.
     * @param node     The type alias declaration node that should be analyzed.
     * @return The resulting reflection or NULL.
     */
    convert(context: Context, node: ts.JSDocTypedefTag): Reflection {
        if (ts.isJSDocTypeExpression(node.typeExpression)) {

            const alias = createDeclaration(context, node, ReflectionKind.TypeAlias);
            const typeExpression = node.typeExpression;
            const type = typeExpression.type;
            alias.type = this.owner.convertType(context, type, context.getTypeAtLocation(type));
            return alias;

        } else if (ts.isJSDocTypeLiteral(node.typeExpression)) {

          let reflection: DeclarationReflection;
          if (context.isInherit && context.inheritParent === node) {
              reflection = <DeclarationReflection> context.scope;
          } else {
              reflection = createDeclaration(context, node, ReflectionKind.Interface);
          }

          const typeExpression = node.typeExpression;
          context.withScope(reflection, () => {
              if (typeExpression.jsDocPropertyTags) {
                  typeExpression.jsDocPropertyTags.forEach((member, isInherit) => {
                      this.owner.convertNode(context, member);
                  });
              }
          });

          return reflection;
        }

    }
}
