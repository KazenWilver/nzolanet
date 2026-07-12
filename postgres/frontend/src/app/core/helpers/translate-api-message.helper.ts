/**
 * Traduz mensagens de erro do ASP.NET Identity (inglês) para português de Portugal.
 */
export const translateApiMessage = (message: string | null | undefined): string => {
  if (!message?.trim()) {
    return '';
  }

  const normalized = message.trim();

  const translations: Array<{ pattern: RegExp; text: string }> = [
    {
      pattern: /passwords must have at least one digit/i,
      text: 'A palavra-passe deve conter pelo menos um dígito (0-9).'
    },
    {
      pattern: /passwords must have at least one lowercase/i,
      text: 'A palavra-passe deve conter pelo menos uma letra minúscula (a-z).'
    },
    {
      pattern: /passwords must have at least one uppercase/i,
      text: 'A palavra-passe deve conter pelo menos uma letra maiúscula (A-Z).'
    },
    {
      pattern: /passwords must be at least (\d+) characters/i,
      text: 'A palavra-passe deve ter pelo menos 6 caracteres.'
    },
    {
      pattern: /incorrect password/i,
      text: 'Palavra-passe actual incorrecta.'
    },
    {
      pattern: /password mismatch/i,
      text: 'Palavra-passe actual incorrecta.'
    },
    {
      pattern: /cannot be tracked/i,
      text: 'Ocorreu um conflito ao processar os dados. Tenta novamente.'
    },
    {
      pattern: /operation completed successfully/i,
      text: 'Operação concluída com sucesso.'
    },
    {
      pattern: /successfully/i,
      text: normalized.replace(/successfully/gi, 'com sucesso')
    }
  ];

  for (const { pattern, text } of translations) {
    if (pattern.test(normalized)) {
      return text;
    }
  }

  return normalized;
};
