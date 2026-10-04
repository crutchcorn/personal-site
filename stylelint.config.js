import stylelint from 'stylelint';

const ruleName = 'project/sass-breakpoints-only';
const messages = stylelint.utils.ruleMessages(ruleName, {
  variable:
    'Declare Sass variables only in src/styles/_breakpoints.scss, using plain length values',
  reference:
    'Use Sass variables only in media queries, through the breakpoints namespace',
  import: 'Use @use only to import the breakpoints partial',
  interpolation: 'Use plain CSS without Sass interpolation',
});

const breakpointsOnly = (enabled) => (root, result) => {
  if (
    !stylelint.utils.validateOptions(result, ruleName, {
      actual: enabled,
      possible: [true],
    })
  )
    return;

  const filename = root.source?.input.file?.replaceAll('\\', '/');
  const isBreakpoints = filename?.endsWith('/src/styles/_breakpoints.scss');
  const isScss = filename?.endsWith('.scss');
  const report = (node, message) =>
    stylelint.utils.report({ node, message, ruleName, result });

  if (isBreakpoints) {
    root.each((node) => {
      if (
        node.type !== 'comment' &&
        !(node.type === 'decl' && node.prop.startsWith('$'))
      ) {
        report(node, messages.variable);
      }
    });
  }

  root.walkDecls((declaration) => {
    if (declaration.prop.startsWith('$')) {
      if (
        !isBreakpoints ||
        declaration.parent.type !== 'root' ||
        !/^\d+(?:\.\d+)?(?:px|em|rem)$/.test(declaration.value)
      ) {
        report(declaration, messages.variable);
      }
    } else if (declaration.value.includes('$')) {
      report(declaration, messages.reference);
    }
  });

  root.walkAtRules((atRule) => {
    if (
      atRule.name === 'use' &&
      (!isScss ||
        !/^(['"])(?:\.\/)?breakpoints\1(?:\s+as\s+breakpoints)?$/.test(
          atRule.params,
        ))
    ) {
      report(atRule, messages.import);
    }

    if (atRule.params.includes('$')) {
      const references = atRule.params.match(/(?:[\w-]+\.)?\$[\w-]+/g) ?? [];
      if (
        !isScss ||
        atRule.name !== 'media' ||
        references.some((reference) => !reference.startsWith('breakpoints.$'))
      ) {
        report(atRule, messages.reference);
      }
    }
  });

  root.walk((node) => {
    const content =
      node.type === 'decl'
        ? `${node.prop}: ${node.value}`
        : node.type === 'atrule'
          ? node.params
          : node.type === 'rule'
            ? node.selector
            : '';
    if (content.includes('#{')) report(node, messages.interpolation);
  });
};

breakpointsOnly.ruleName = ruleName;
breakpointsOnly.messages = messages;

export default {
  extends: ['stylelint-config-standard-scss'],
  customSyntax: 'postcss-scss',
  plugins: [stylelint.createPlugin(ruleName, breakpointsOnly)],
  overrides: [
    {
      files: ['**/*.css'],
      rules: {
        // A slash in a CSS font shorthand is not a Sass arithmetic operator.
        'scss/operator-no-unspaced': null,
      },
    },
  ],
  rules: {
    [ruleName]: true,
    'max-nesting-depth': 0,
    'at-rule-disallowed-list': [
      'mixin',
      'include',
      'extend',
      'function',
      'return',
      'if',
      'else',
      'each',
      'for',
      'while',
      'at-root',
      'debug',
      'warn',
      'error',
      'forward',
      'import',
    ],
    'function-no-unknown': true,
    'selector-pseudo-class-no-unknown': [
      true,
      { ignorePseudoClasses: ['global', 'local'] },
    ],
    'scss/at-use-no-unnamespaced': true,
    // The inherited site's selectors intentionally share a cascade across sections.
    'no-descending-specificity': null,
  },
};
