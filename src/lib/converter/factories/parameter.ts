import * as ts from 'typescript';
import * as _ts from '../../ts-internal';

import { ReflectionFlag, ReflectionKind, ParameterReflection, SignatureReflection } from '../../models/reflections/index';
import { Context } from '../context';
import { Converter } from '../converter';
import { convertDefaultValue } from '../convert-expression';

/**
 * Create a parameter reflection for the given node.
 *
 * @param context  The context object describing the current state the converter is in.
 * @param node  The parameter node that should be reflected.
 * @returns The newly created parameter reflection.
 */
export function createParameter(context: Context, node: ts.ParameterDeclaration): ParameterReflection {
    const signature = <SignatureReflection> context.scope;
    if (!(signature instanceof SignatureReflection)) {
        throw new Error('Expected signature reflection.');
    }

    const parameter = new ParameterReflection(signature, node.symbol.name, ReflectionKind.Parameter);
    context.registerReflection(parameter, node);
    context.withScope(parameter, () => {
        let optional = !!node.questionToken;
        if (_ts.isBindingPattern(node.name)) {
            parameter.type = context.converter.convertType(context, node.name);
            parameter.name = '__namedParameters';
        } else {
            let type = node.type;
            const jsDocParameters = ts.getJSDocTags(node);
            if (!type && jsDocParameters) {
                for (let i = 0, ii = jsDocParameters.length; i < ii; ++i) {
                    const param = jsDocParameters[i];
                    if (ts.isJSDocParameterTag(param) && param.name.getText() === node.name.getText() && param.typeExpression) {
                        type = param.typeExpression.type;
                        if (ts.isJSDocOptionalType(type)) {
                            optional = true;
                            type = type.type;
                        } else if (ts.isJSDocNonNullableType(type) || ts.isJSDocNullableType(type)) {
                            type = type.type;
                        }
                        break;
                    }
                }
            }
            parameter.type = context.converter.convertType(context, type, context.getTypeAtLocation(node));
        }

        parameter.defaultValue = convertDefaultValue(node);
        parameter.setFlag(ReflectionFlag.Optional, optional);
        parameter.setFlag(ReflectionFlag.Rest, !!node.dotDotDotToken);
        parameter.setFlag(ReflectionFlag.DefaultValue, !!parameter.defaultValue);

        if (!signature.parameters) {
            signature.parameters = [];
        }
        signature.parameters.push(parameter);
    });

    context.trigger(Converter.EVENT_CREATE_PARAMETER, parameter, node);
    return parameter;
}
