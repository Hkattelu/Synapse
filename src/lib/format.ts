import prettier from 'prettier/standalone';
import parserBabel from 'prettier/plugins/babel';
import parserTypescript from 'prettier/plugins/typescript';
import parserHtml from 'prettier/plugins/html';

export async function formatCode(
  code: string,
  language: string = 'javascript'
): Promise<string> {
  const opts: prettier.Options = {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: true,
    arrowParens: 'always',
    plugins: [parserBabel, parserTypescript, parserHtml],
    parser:
      language === 'typescript'
        ? 'typescript'
        : language === 'tsx'
        ? 'typescript'
        : language === 'html'
        ? 'html'
        : 'babel',
  };

  try {
    return await prettier.format(code, opts as any);
  } catch (e) {
    // Fallback to original code if formatting fails
    return code;
  }
}

