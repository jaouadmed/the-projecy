@echo off
echo Creating DoliPaaS project structure...

:: Create main directories
mkdir frontend\public
mkdir frontend\src\components
mkdir frontend\src\pages
mkdir frontend\src\services
mkdir frontend\src\styles

mkdir backend\src\controllers
mkdir backend\src\models
mkdir backend\src\routes
mkdir backend\src\services

mkdir infrastructure\docker\dolibarr
mkdir infrastructure\docker\wordpress
mkdir infrastructure\docker\odoo
mkdir infrastructure\kubernetes
mkdir infrastructure\terraform

mkdir database
mkdir scripts

echo.
echo Project structure created successfully!
echo Run this script to create the folder structure defined in project-structure.md
echo.