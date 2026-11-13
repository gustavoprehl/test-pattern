// Necessário para o babel-jest transpilar os módulos ES (import/export) usados no projeto.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
