@echo off
echo ===================================================
echo [AgriFlow] - Initialisation et Push du Projet
echo ===================================================
echo.

:: Verification si le dossier .git existe deja
if not exist .git (
    echo [1/5] Initialisation du depot Git local...
    git init
) else (
    echo [1/5] Depot Git deja initialise.
)

echo [2/5] Configuration de l'identite Git locale...
git config user.email "essonojeanmarcel@gmail.com"
git config user.name "Jean Marcel Essono"
echo Identite configuree pour essonojeanmarcel@gmail.com.

echo [3/5] Ajout des fichiers...
git add .

echo [4/5] Creation du commit...
git commit -m "Initial commit - AgriFlow ERP structure"

echo [5/5] Configuration du remote et Push vers GitHub...
git branch -M main

:: Supprime le remote s'il existe deja pour eviter l'erreur de duplication
git remote remove origin 2>nul
git remote add origin https://github.com/JME120495/AgriFlow.git

echo.
echo Tentative de push vers https://github.com/JME120495/AgriFlow.git...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ATTENTION] Le push direct a echoue. Si le depot distant n'est pas vide,
    echo tentez de forcer le push avec la commande :
    echo git push -u origin main --force
) else (
    echo.
    echo [SUCCES] Le projet a ete pousse avec succes !
)
echo.
pause
