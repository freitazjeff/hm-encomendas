// Lista fixa de sabores. Para incluir um sabor novo, basta adicionar um nome em BRUTOS.
const BRUTOS = [
  'açaí', 'uva', 'abacate', 'abacaxi', 'amendoim', 'limão', 'cajá', 'morango', 'milho verde',
  'chocolate', 'azulão', 'côco', 'doce de leite', 'coalhada', 'graviola', 'chiclete', 'tapioca',
  'goiaba', 'tangerina', 'buriti', 'cupuaçu',
]

// Primeira letra maiúscula, sem espaços sobrando
const cap = (s) => {
  const t = s.trim().replace(/\s+/g, ' ')
  return t.charAt(0).toLocaleUpperCase('pt-BR') + t.slice(1).toLocaleLowerCase('pt-BR')
}

// Remove duplicados (ignorando maiúsculas/minúsculas) e ordena de A a Z
const unicos = [...new Map(BRUTOS.map((s) => [cap(s).toLocaleLowerCase('pt-BR'), cap(s)])).values()]
  .sort((a, b) => a.localeCompare(b, 'pt-BR'))

// "Variados" fica sempre por último
export const SABORES = [...unicos, 'Variados']
