const fs = require('fs/promises');
const path = require('path');
const readline = require('readline');

const generatorsPath = path.join(__dirname, 'generators');
const modulePath = path.join(__dirname, 'src/modules');

function colorize(text, colorHex, fontWeight = 'normal') {
  const fontWeightCode = fontWeight === 'bold' ? '1' : '0';

  // Convertir la couleur hexadécimale en valeurs RGB
  const red = parseInt(colorHex.slice(1, 3), 16);
  const green = parseInt(colorHex.slice(3, 5), 16);
  const blue = parseInt(colorHex.slice(5, 7), 16);

  // Créer le code ANSI pour la couleur RGB
  const colorCode = `38;2;${red};${green};${blue}`;

  // Retourner le texte coloré et stylisé
  return `\x1b[${fontWeightCode};${colorCode}m${text}\x1b[0m`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function copyFiles(source, target, moduleName, replaceTemplate = false) {
  let content = await fs.readFile(source, 'utf-8');
  if (replaceTemplate) {
    if (path.basename(source) === 'meta.json') {
      const meta = JSON.parse(content);
      meta.label = capitalize(moduleName.replace(/-/g, ' '));
      content = JSON.stringify(meta, null, 2);
    } else {
      content = content.replace(/template/g, moduleName); // Remplacer 'template' par le nom du module
    }
  }
  await fs.writeFile(target, content);
}

async function copyFolderRecursive(source, target, moduleName, replaceTemplate = false) {
  const files = await fs.readdir(source);

  for (const file of files) {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);

    const stats = await fs.stat(curSource);

    if (stats.isDirectory()) {
      await fs.mkdir(curTarget);
      await copyFolderRecursive(curSource, curTarget, moduleName, replaceTemplate);
    } else {
      await copyFiles(curSource, curTarget, moduleName, replaceTemplate);
    }
  }
}

// Récupérer la liste des modules disponibles dans le répertoire 'generators' sauf le module 'default'
async function getModulesList() {
  const modules = await fs.readdir(generatorsPath);
  const filteredModules = await Promise.all(modules.map(async (name) => {
    const stats = await fs.stat(path.join(generatorsPath, name));
    return stats.isDirectory() && name !== 'default' ? name : null;
  }));
  return filteredModules.filter(Boolean);
}

// Fonction pour poser une question à l'utilisateur et récupérer sa réponse
async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Fonction principale pour générer un module
async function generateModule() {
  const colorYellow = '#FBE207'; // Couleur jaune
  const colorRed = '#D82626'; // Couleur rouge
  const colorGreen = '#1AE21F'; // Couleur verte
  const colorBlue = '#00d1ff'; // Couleur bleue

  try {
    const modules = await getModulesList();

    // Ajouter le module 'Default' à la liste des modules
    modules.unshift('Default');
    let moduleIndex = 0;
    // Afficher la liste des modules disponibles
    if (modules.length >= 2) {
      console.log(colorize('Available modules:', colorBlue, 'bold'));
      printModuleTableList(modules);

      const choice = await promptUser(colorize('Select a module (enter number): ', colorYellow, 'bold'));
      moduleIndex = parseInt(choice, 10) - 1;
    }

    // Vérifier si le choix est valide sinon afficher un message d'erreur
    if (isNaN(moduleIndex) || moduleIndex < 0 || moduleIndex >= modules.length) {
      console.error(colorize('Invalid choice. Aborting.', colorRed, 'bold'));
      return;
    }

    const selectedModule = modules[moduleIndex];
    let newModulePath = "";
    let moduleName = "";
    const isDefaultModule = selectedModule === 'Default' || moduleIndex === 0;
    if (isDefaultModule) {
      moduleName = await promptUser(colorize('Enter the module name: ', colorYellow, 'bold'));
      newModulePath = path.join(modulePath, `${moduleName}.module`);
    } else {
      moduleName = selectedModule;
      newModulePath = selectedModule.endsWith('.module') ? path.join(modulePath, selectedModule) : path.join(modulePath, `${selectedModule}.module`);
    }

    try {
      await fs.access(newModulePath);
      console.error(colorize(`Error: Module '${moduleName}' already exists.`, colorRed, 'bold'));
    } catch (error) {
      try {
        await fs.mkdir(newModulePath);
        const templatePath = path.join(generatorsPath, selectedModule.toLocaleLowerCase());

        await copyFolderRecursive(templatePath, newModulePath, moduleName, isDefaultModule);

        console.log(colorize(`Module '${moduleName}' created successfully from template '${selectedModule}'.`, colorGreen, 'bold'));
      } catch (error) {
        console.error(colorize('Error creating module:', colorRed, 'bold'), error.message);
      }
    }
  } catch (error) {
    console.error(colorize('Error:', colorRed, 'bold'), error.message);
  }
}

function printModuleTableList(modules) {
  const terminalWidth = process.stdout.columns;
  const columns = terminalWidth < 90 ? 2 : 3; // Utiliser 2 colonnes si la largeur du terminal est inférieure à 90 caractères

  const colWidth = Math.floor(terminalWidth / columns) - 2; // Calculer la largeur de chaque colonne
  let row = '';

  modules.forEach((mod, index) => {
    const cell = colorize(`${index + 1}: ${capitalize(mod)}`, "#FFFFFF", 'normal').padEnd(colWidth, ' ');
    row += cell;

    if ((index + 1) % columns === 0) {
      console.log(row);
      row = '';
    }
  });

  // Afficher la dernière ligne si elle n'est pas vide
  if (row) {
    console.log(row);
  }
}

generateModule();
