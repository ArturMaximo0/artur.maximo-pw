# Cadastro de funcionários

Aplicação CRUD com MySQL e autenticação administrativa por sessão em cookie `HttpOnly`. As senhas são armazenadas com scrypt; não há senha padrão nem credenciais em texto puro no banco.

## Configuração

1. Instale Node.js e MySQL.
2. No MySQL, execute `database.sql`.
3. Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` se os valores locais não forem `localhost`, `3306`, `root`, senha vazia e `crud_funcionarios`.
4. No terminal, dentro desta pasta, execute `npm install`.
5. Execute `npm run criar-usuario` em um terminal interativo e cadastre a conta administrativa. A senha digitada não é exibida.
6. Execute `npm start` e acesse `http://localhost:3000`.

Em produção, defina `NODE_ENV=production` para que o cookie de sessão também exija HTTPS (`Secure`). As sessões ficam na memória do processo; reiniciar o servidor encerra as sessões ativas.

## Testes

Execute `npm test` para verificar os hashes e o fluxo HTTP de login, proteção das páginas e API, operações do CRUD e logout.
