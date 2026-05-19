require('dotenv').config();
const mysql = require('mysql2/promise');

const PROJECTS = [
  {
    slug: 'cicd-kubernetes',
    num: '01',
    title: 'CI/CD Pipeline & Kubernetes Deployment',
    short_desc: 'Automated Node.js app deployment using GitHub Actions and Docker Hub. CI/CD pipeline builds and pushes Docker images on every commit, then deploys to a Kubernetes cluster via Minikube — covering pods, deployments, services, and scaling.',
    description: 'Automated Node.js app deployment using GitHub Actions and Docker Hub.',
    tech_stack: 'GitHub Actions,Docker,Kubernetes,Minikube,Node.js,YAML',
    github_link: 'https://github.com/sarthaksharma/devops-pipeline',
    demo_link: null,
    image_url: null,
    featured: 1,
    gradient: 'linear-gradient(135deg, #1a1040 0%, #312e81 50%, #1e3a5f 100%)',
    accent_a: '#818cf8',
    accent_b: '#38bdf8',
    label: 'DevOps · CI/CD',
    hero: 1,
    overview: 'This project demonstrates a complete end-to-end DevOps workflow combining CI/CD automation with container orchestration. It covers two main areas: automated image building via GitHub Actions and live deployment on Kubernetes.',
    problem: 'Manually deploying Node.js applications is error-prone, slow, and inconsistent across environments. Teams waste hours on repetitive build-test-deploy cycles with no visibility into failures.',
    solution: 'A fully automated pipeline that triggers on every git push — building, testing, and deploying the application without any manual intervention. Combined with Kubernetes, it ensures high availability and easy horizontal scaling.',
    tech_stack_json: JSON.stringify([
      { name: 'GitHub Actions', purpose: 'CI/CD pipeline automation — triggers on push, builds Docker images' },
      { name: 'Docker & Docker Hub', purpose: 'Containerization and image registry for portable deployments' },
      { name: 'Kubernetes (Minikube)', purpose: 'Container orchestration — pods, deployments, services, scaling' },
      { name: 'Node.js', purpose: 'Application runtime — the target application being deployed' },
      { name: 'YAML', purpose: 'Configuration language for GitHub Actions workflows and K8s manifests' },
      { name: 'kubectl', purpose: 'CLI tool for interacting with the Kubernetes cluster' },
      { name: 'Bash', purpose: 'Shell scripts for automation helpers and setup tasks' },
    ]),
    timeline_json: JSON.stringify([
      { step: '01', title: 'Setup GitHub Repository', desc: 'Created repository structure with Node.js app, Dockerfile, and GitHub Actions workflow directory.' },
      { step: '02', title: 'Write Dockerfile', desc: 'Containerized the Node.js application with a multi-stage Dockerfile for minimal image size.' },
      { step: '03', title: 'Configure GitHub Actions', desc: 'Wrote .github/workflows/ci.yml to trigger on push, build the Docker image, and push to Docker Hub.' },
      { step: '04', title: 'Setup Minikube', desc: 'Installed and started a local Kubernetes cluster using Minikube on the dev machine.' },
      { step: '05', title: 'Write K8s Manifests', desc: 'Created Deployment and Service YAML manifests to run the containerized app on the cluster.' },
      { step: '06', title: 'Deploy & Validate', desc: 'Applied manifests using kubectl, verified pod health, and tested the live endpoint.' },
    ]),
    learnings_json: JSON.stringify([
      'How GitHub Actions workflows are triggered and structured',
      'Docker multi-stage builds for production-ready images',
      'Kubernetes core concepts: Pods, Deployments, ReplicaSets, Services',
      'Connecting Docker Hub credentials as GitHub Secrets for secure CI/CD',
      'Debugging failing pods with kubectl logs and kubectl describe',
    ]),
  },
  {
    slug: 'automated-backup',
    num: '02',
    title: 'Automated Backup Tool',
    short_desc: 'Python utility that auto-generates date-stamped .zip archives of any directory. No external software needed — ideal for periodic backups and integration into larger automation workflows.',
    description: 'Python utility that auto-generates date-stamped .zip archives of any directory.',
    tech_stack: 'Python,Automation,Scripting,File I/O',
    github_link: 'https://github.com/SarthakSharma007/automated-backup.py.git',
    demo_link: null,
    image_url: null,
    featured: 1,
    gradient: 'linear-gradient(135deg, #0d2818 0%, #065f46 50%, #0c4a6e 100%)',
    accent_a: '#34d399',
    accent_b: '#22d3ee',
    label: 'Automation · Python',
    hero: 0,
    overview: 'A lightweight Python automation tool designed to create compressed, date-stamped backups of files and folders. It generates a .zip archive of a specified source directory and stores it in a chosen destination folder, named with the current date for easy version tracking.',
    problem: 'Data loss due to accidental deletion, system failure, or human error is a constant risk. Manual backups are forgotten, inconsistently named, and time-consuming.',
    solution: 'A simple Python script that can be scheduled via cron (Linux) or Task Scheduler (Windows) to automatically create .zip archives of any directory, named with the current date, and stored in a designated backup folder.',
    tech_stack_json: JSON.stringify([
      { name: 'Python 3', purpose: 'Core language for scripting the automation logic' },
      { name: 'zipfile module', purpose: 'Built-in Python library for creating .zip archives' },
      { name: 'os / pathlib', purpose: 'File system traversal, path handling, and directory operations' },
      { name: 'datetime', purpose: 'Generating date-stamped filenames for each backup archive' },
      { name: 'shutil', purpose: 'High-level file operations for copying and managing files' },
    ]),
    timeline_json: JSON.stringify([
      { step: '01', title: 'Define Requirements', desc: 'Identified key features: source/destination config, date-stamped names, recursive directory zipping.' },
      { step: '02', title: 'Write Core Logic', desc: "Used Python's zipfile module to recursively walk the source directory and compress all files." },
      { step: '03', title: 'Add Date Stamping', desc: 'Integrated datetime to generate filenames like backup_2025-10-27.zip for easy sorting.' },
      { step: '04', title: 'Configuration', desc: 'Made source and destination paths configurable at the top of the script for easy reuse.' },
      { step: '05', title: 'Test & Validate', desc: 'Tested on multiple directory structures, verified archive integrity and correct file paths.' },
      { step: '06', title: 'Schedule (Optional)', desc: 'Documented how to schedule via cron job on Linux or Windows Task Scheduler.' },
    ]),
    learnings_json: JSON.stringify([
      "Python's built-in zipfile and shutil modules for file operations",
      'Recursive directory traversal using os.walk()',
      'How to make scripts configurable and reusable',
      'Automating repetitive tasks with minimal dependencies',
      'Scheduling Python scripts for periodic execution',
    ]),
  },
  {
    slug: 'bash-automation-suite',
    num: '03',
    title: 'DevOps Bash Automation Suite',
    short_desc: 'Bash scripts that deploy Django on Docker Compose and provision AWS EC2 instances via CLI — built for simplicity, reusability, and reliability.',
    description: 'Bash scripts that deploy Django on Docker Compose and provision AWS EC2 instances via CLI.',
    tech_stack: 'Bash,Docker,Docker Compose,AWS CLI,EC2,Nginx,Linux',
    github_link: 'https://github.com/SarthakSharma007/use-shell-scripting-to-deploy.git',
    demo_link: null,
    image_url: null,
    featured: 1,
    gradient: 'linear-gradient(135deg, #1c0a2e 0%, #7c2d12 50%, #431407 100%)',
    accent_a: '#f97316',
    accent_b: '#fb923c',
    label: 'Infrastructure · AWS',
    hero: 0,
    overview: 'A collection of two Bash automation scripts that streamline DevOps workflows. The first automates Django application deployment using Docker and Docker Compose with Nginx as a reverse proxy. The second automates AWS EC2 instance creation using the AWS CLI, reducing infrastructure provisioning to a single command.',
    problem: 'Deploying Django apps and provisioning cloud infrastructure manually involves repetitive commands, is error-prone, and creates inconsistency between environments. Every deployment becomes a potential failure point.',
    solution: 'Two purpose-built Bash scripts: one wraps the entire Docker Compose deployment flow into a single executable, the other uses the AWS CLI to provision EC2 instances with predefined configurations — all with proper error handling and output logging.',
    tech_stack_json: JSON.stringify([
      { name: 'Bash (Shell Scripting)', purpose: 'Primary scripting language for both automation tools' },
      { name: 'Docker', purpose: 'Containerization of the Django application' },
      { name: 'Docker Compose', purpose: 'Multi-container orchestration for Django + Nginx + database' },
      { name: 'Nginx', purpose: 'Reverse proxy server routing traffic to the Django app' },
      { name: 'AWS CLI', purpose: 'Command-line interface for provisioning EC2 instances on AWS' },
      { name: 'Amazon EC2', purpose: 'Cloud compute instances being provisioned by the automation script' },
      { name: 'Linux', purpose: 'Operating system environment where scripts are executed' },
    ]),
    timeline_json: JSON.stringify([
      { step: '01', title: 'Script 1 — Django Deployment', desc: 'Wrote a Bash script to pull the latest code, build Docker images, run Docker Compose, and configure Nginx.' },
      { step: '02', title: 'Nginx Configuration', desc: "Created Nginx reverse proxy config to forward HTTP requests to the Django container's internal port." },
      { step: '03', title: 'Error Handling', desc: 'Added set -e and status checks to halt execution and log errors if any step fails.' },
      { step: '04', title: 'Script 2 — EC2 Provisioning', desc: 'Wrote a Bash script using aws ec2 run-instances with predefined AMI, instance type, key pair, and security groups.' },
      { step: '05', title: 'Output & Logging', desc: 'Captured instance ID and public IP after provisioning and displayed them in a readable format.' },
      { step: '06', title: 'Documentation', desc: 'Documented prerequisites (AWS CLI configured, Docker installed) and usage instructions.' },
    ]),
    learnings_json: JSON.stringify([
      'Writing production-grade Bash scripts with proper error handling',
      'Docker Compose multi-service application setup with Nginx',
      'AWS CLI commands for EC2 instance management',
      'Parameterizing scripts for reuse across environments',
      'Linux system administration basics for script execution',
    ]),
  },
];

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  console.log('Seeding projects...');

  for (const p of PROJECTS) {
    // Check if slug already exists
    const [rows] = await conn.execute('SELECT id FROM projects WHERE slug = ?', [p.slug]);
    
    if (rows.length > 0) {
      // Update existing row
      await conn.execute(
        `UPDATE projects SET num=?, label=?, short_desc=?, description=?, tech_stack=?,
         github_link=?, demo_link=?, image_url=?, featured=?, gradient=?, accent_a=?,
         accent_b=?, hero=?, overview=?, problem=?, solution=?,
         tech_stack_json=?, timeline_json=?, learnings_json=?
         WHERE slug=?`,
        [p.num, p.label, p.short_desc, p.description, p.tech_stack,
         p.github_link, p.demo_link, p.image_url, p.featured, p.gradient, p.accent_a,
         p.accent_b, p.hero, p.overview, p.problem, p.solution,
         p.tech_stack_json, p.timeline_json, p.learnings_json, p.slug]
      );
      console.log(`  UPDATED: ${p.title}`);
    } else {
      // Insert new
      await conn.execute(
        `INSERT INTO projects (slug, num, title, label, short_desc, description, tech_stack,
         github_link, demo_link, image_url, featured, gradient, accent_a, accent_b, hero,
         overview, problem, solution, tech_stack_json, timeline_json, learnings_json)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [p.slug, p.num, p.title, p.label, p.short_desc, p.description, p.tech_stack,
         p.github_link, p.demo_link, p.image_url, p.featured, p.gradient, p.accent_a,
         p.accent_b, p.hero, p.overview, p.problem, p.solution,
         p.tech_stack_json, p.timeline_json, p.learnings_json]
      );
      console.log(`  INSERTED: ${p.title}`);
    }
  }

  console.log('Seed complete!');
  await conn.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
