# HubSpot Boilerplate

This is the template of the MTG for developing and uploading a **HubSpot** website.

## About

## Version

Node Version: 20.6.0

Project Version: 3.1.0

### 2025

- Ajout de modules par défaut

### 2024

- Réorganisation des fichiers

- Optimisations et améliorations des performances

### 2023

- Refonte du Watcher SCSS et JS

- Utilisation du CSS et JS propre à chaque module

## Structure

The project structure is:
-   **/src** folder for all your source files
-   **/dist** folder that is synced with HubSpot.
-   **/generators** folder for generating a new module
-   **/.env** file where you can define environment variables

## Features

- Gulp
- SCSS
- Webpack
- GSAP
- Watcher
- Environment Variables (.env file)
- Package Manager (Yarn)
- Generate Module & Template with CLI

## Plugin Installed

Thoses plugins can be updated realy easilly by using packages manager.

Just remove them in the package.json and run `yarn`.

To install them, just run `yarn add + plugin-name`

Comment or uncomment them in main.js :)

## Known Issues

- When Watcher is running, if you create new modules files, you need to restart the watcher to take them into account.
- When changing the value of Sass global variables in functions.scss, the change are not updated for each Sass module file. You need to make a full deploy to see the changes.
  
# Getting Started

## Install Dependencies

- Installer Homebrew : https://brew.sh/index_fr

- Installer Git : ```brew install git```

- Install Java.

- Install Yarn : ```brew install yarn```

- Install NVM : https://github.com/nvm-sh/nvm#installing-and-updating

- Install Node.js, a Javascript runtime environment that enables the local tools : ```nvm install {version of node.js}```

- Install the gulp-cli globally: ```yarn global add grunt-cli```

- Install Visual Studio Code: https://code.visualstudio.com/

- Install Hubl Extension: https://marketplace.visualstudio.com/items?itemName=WilliamSpiro.hubl

## Create the client project in Github

- Create a new project in [Make the Grade Group](https://github.com/Make-The-Grade) in Github

- Name it properly

- Select the HubSpot Boilerplate 2023 as template

- Let all the other default options checked


## Import the boilerplate ( if you don't use the boilerplate as a template)

```
git clone [url .git https du boilerplate]
```

- Rename the folder

- Sync your code with your repo by using this command :

```
git remote set-url origin [url .git https du nouveau repository]
```
 

- In the project settings > repository > protected branches ( expand ) > Unprotect the "main" branch

- Deploy your code on master branch
```
git push -uf -origin main
```

## Install all project dependencies

Run in the project root:

```bash
yarn  install
```

## Update dependencies

Run the command:

```bash
yarn upgrade-interactive --latest   
```

## Setup Hubspot Configuration

### Package.json

Update the name of your project

### .env

Update your :
- Developement portal : ```DEV_PORTAL=<HubSpot portal name>```
- Production portal : ```PROD_PORTAL=<HubSpot portal name>```
- Directory Name : ```DIRECTORY_NAME=<the name of the root directory of your project>```


Auth on your hubspot portal using the official documentation
```
yarn hs:auth
```

** BE CAREFULL, THE KEY USED DURING THIS COMMAND MUST BE THE SAME AS THE ONE USED IN YOUR PACKAGE.JSON **

### Update all the naming

src/theme.json -> Update label

src/templates -> Update blog-listing / blog-post + pages/multi-purpose.html + pages/landing-page.html + system/*

Rename all mtg-hubspot-boilerplate by the name of the project

### Auto-deployment (Watcher)

- Deploy a first time to make sure of the good parameter setting by executing the command :
- 
  ```yarn deploy:dev``` | ```yarn deploy:prod```

- Go to the portal -> Create a first page by selecting the theme previously renamed in the code base.

To develop continuously, run the following command in a first terminal. This command will activate a watch on the whole project :

```yarn watch:dev``` | ```yarn watch:prod```

### SASS Management

- Start creating the style guide accorded to your project by updating function.scss

## Developing new modules

Use the command `yarn hs:module <name>` to create a new module. This will create a new folder in the modules folder. This folder contains the following files:

```
[module name].module/
|	fields.json
|	meta.json
|	module.scss
|	module.html
|	module.js
```
Don't use the module.js files of a module. We only use the src/js folder to edit Javascript. More info : https://github.com/bradhave94/HubSpot/wiki/Custom-Modules-JSON

### Settings

Every module contains a meta.json file. This file contains properties with settings for the Hubspot module:
```
{
"css_assets": [ ],

"external_js": [ ],

"global": true,

"help_text": "",

"host_template_types": [ "PAGE" ],

"js_assets": [ ],

"other_assets": [ ],

"smart_type": "NOT_SMART",

"tags": [ ],

"is_available_for_new_content": true

}
```
 
To be able to use the new module in the Hubspot templates you should edit the meta.json file and change is_available_for_new_content to true.

If you need a global module, you can edit the property global and set it to true.


### Fields

Each module contains a `fields.json` file. This file contains all the fields a Hubspot user can edit to change the content of the module.

This boilerplate includes various fields utils `(/src/utils)`. Create a `/fields/fields.js` file in each module. Use this file to list which utils and custom fields should be used to build up a `fields.json` file (see Gulp buildModuleFields).


Example fields.js:

```

exports.config = function() {

return [

'src/modules/example.module/fields/content.json',

'src/modules/example.module/fields/image.json',

'src/utils/fields/padding.json',

'src/utils/fields/mobile_padding.json'

]

}

```

  

### Github Workflow

  

<details>

<summary>Click to expand!</summary>

  

#### Basics of Github - Skip this part if you're familiar with Git

  

##### About

  

By far, the most widely used modern version control system in the world today is Git. Git is a mature, actively maintained open source project originally developed in 2005 by Linus Torvalds, the famous creator of the Linux operating system kernel. A staggering number of software projects rely on Git for version control, including commercial projects as well as open source. Developers who have worked with Git are well represented in the pool of available software development talent and it works well on a wide range of operating systems and IDEs (Integrated Development Environments)

  

Having a distributed architecture, Git is an example of a DVCS (hence Distributed Version Control System). Rather than have only one single place for the full version history of the software as is common in once-popular version control systems like CVS or Subversion (also known as SVN), in Git, every developer's working copy of the code is also a repository that can contain the full history of all changes.

  

In addition to being distributed, Git has been designed with performance, security and flexibility in mind.

  

##### Commands

  

1. git config

Utility : To set your user name and email in the main configuration file.

How to : To check your name and email type in git config --global user.name and git config --global user.email. And to set your new email or name git config --global user.name = “Antoine Ravet" and git config --global user.email = “aravet@makethegrade.fr”

  

2. git init

Utility : To initialise a git repository for a new or existing project.

How to : git init in the root of your project directory.

  

3. git clone

Utility : To copy a git repository from remote source, also sets the remote to original source so that you can pull again.

How to : git clone <:clone git url:>

  

4. git status

Utility : To check the status of files you’ve changed in your working directory, i.e, what all has changed since your last commit.

How to : git status in your working directory. lists out all the files that have been changed.

  

5. git add

Utility : adds changes to stage/index in your working directory.

How to : git add .

  

6. git add

Utility : adds changes to stage/index in your working directory.

How to : git add .

  

7. git commit

Utility : commits your changes and sets it to new commit object for your remote.

How to : git commit -m”sweet little commit message”

  

8. git push/git pull

Utility : Push or Pull your changes to remote. If you have added and committed your changes and you want to push them. Or if your remote has updated and you want those latest changes.

How to : git pull <:remote:> <:branch:> and git push <:remote:> <:branch:>

  

9. git branch

Utility : Lists out all the branches.

How to : git branch or git branch -a to list all the remote branches as well.

  

10. git checkout

Utility : Switch to different branches

How to : git checkout <:branch:> or \*\*\_git checkout -b <:branch:> if you want to create and switch to a new branch.

  

11. git stash

Utility : Save changes that you don’t want to commit immediately.

How to : git stash in your working directory. git stash apply if you want to bring your saved changes back.

  

12. git merge

Utility : Merge two branches you were working on.

How to : Switch to branch you want to merge everything in. git merge <:branch_you_want_to_merge:>

  

13. git reset

Utility : You know when you commit changes that are not complete, this sets your index to the latest commit that you want to work on with.

How to : git reset <:mode:> <:COMMIT:>

  

14. git remote

Utility : To check what remote/source you have or add a new remote.

How to : git remote to check and list. And git remote add <:remote_url:>

  

##### Feature Branch Workflow

  

One of the biggest advantages of Git is its branching capabilities. Unlike centralized version control systems, Git branches are cheap and easy to merge. This facilitates the feature branch workflow popular with many Git users.

Feature branches provide an isolated environment for every change to your codebase. When a developer wants to start working on something—no matter how big or small—they create a new branch. This ensures that the master branch always contains production-quality code.

  

Using feature branches is not only more reliable than directly editing production code, but it also provides organizational benefits. They let you represent development work at the same granularity as the your agile backlog. For example, you might implement a policy where each Jira ticket is addressed in its own feature branch.

  

Here are the basic steps to start using feature branches in your project.

  

- Start on master

- Create a new feature branch

- Implement your changes on that branch

- Push the feature branch to your remote repo

- Create a pull request for your new changes

  

#### Github Workflow

  

##### Start on Master

  

When starting a new feature, I make sure to start with the latest and greatest of the codebase from the main development branch—this commonly referred to as master:

  

```

# switch to the master branch

git checkout master

# fetch the latest changes from the remote git repository

git pull origin master

```

  

This reduces complications of dealing with out-of-date code, and reduces the chances of merge issues.

  

##### Create a Feature Branch

  

Now, I create a local branch to house the changes required for the new feature.

  

Here again we are using the term ‘feature’ loosely. It’s a logical grouping of code and configuration changes to enable a new portion of the code, fix an issue, or improve existing code. The idea is to use your best judgement and to try to keep the scope of the changes limited to a single logical issue.

  

`git checkout -b new_super_feature_mtg`

  

This will create a new branch called new_super_feature_mtg and check it out. We can think of this new branch as a copy of master, because it was what we had checked out, and it keeps the contents just as they were. We can now make new changes in our new branch without affecting the master branch.

##### Modify Code


Now, we implement the new feature / bug fix. Work as you would normally, making small incremental changes and checking them into the local feature branch.


Use descriptive comments when adding new changes so the history of changes is easy to follow. They can still be short and succinct, but be clear.


One useful way to think about commit messages is that together they make up the recipe for your project. “Add linting to application code” or “Add minification step” are very clear explanations for what your code is doing.

  

Clear commits allow your team to stay up to date with what’s happening in the code-base. They keep others more informed about the changes being made. They also help when you are looking back at the history of the project (usually when you are trying to understand when a bug was introduced). Seeing clear commit messages in your git history can help you hone in on issues a lot more quickly. And, as your project and team grow it can be worthwhile to standardize on commit message content and format, similarly to how you might with coding styles.

##### Push Feature Branch to Remote

Ok, you are done with the implementation. You’ve checked and double checked the changes, and you are now ready to have them integrated into the main code base.

The first step of the review process is to push your feature branch to `origin`.

`git push origin new_super_feature_mtg`

##### Create Pull Request

With your feature branch now pushed, navigate to the project’s GitHub page (you could also check out hub which provides command line tools for working with GitHub, in this case hub browse would open the GitHub project page for you). On the main page, you should see a new little toolbar that shows your feature branch listed and asks if you want to create a pull request from it. So let’s do it!


![alt text](https://static.bocoup.com/blog/git-workflow/pr_option.png)

When creating a pull request (or PR, as they are known by all the cool kids these days), you want to summarize the changes being made for this new feature and give it a descriptive title.

You can reference existing issues or other PR’s by typing ‘#’ followed by the issue number or any word from the issue title. A little pop-up should help with picking the right issue number.
</details>
