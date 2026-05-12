echo OFF

echo --- Retirando Usuario GitHUB ----

git config --global --unset-all user.email
git config --global --unset-all user.name

echo --- Configurando Usuario GitHUB ----

git config --global user.name "Artur Maximo"
git config --global user.email artur_fonseca@outlook.com
echo --- Mostrando a configuração atual do Github no computador

git config --list

git clone https://github.com/ArturMaximo0/artur.maximo-pw.git


pause