const { promisePool } = require('./config/db');

const CATEGORIES = [
  {
    id: 'cloud',
    label: 'Cloud & DevOps',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
    glow: 'rgba(99,102,241,0.4)',
    textColor: '#e0f2fe',
    span: 'wide',
    skills: [
      { name: 'Docker',      icon: 'devicon-docker-plain colored',                    bg: '#2496ed22' },
      { name: 'Kubernetes',  icon: 'devicon-kubernetes-plain colored',                bg: '#326ce522' },
      { name: 'Jenkins',     icon: 'devicon-jenkins-line colored',                    bg: '#d3342022' },
      { name: 'Git',         icon: 'devicon-git-plain colored',                       bg: '#f0502422' },
      { name: 'Terraform',   icon: 'devicon-terraform-plain colored',                 bg: '#7b42bc22' },
      { name: 'Ansible',     icon: 'devicon-ansible-plain colored',                   bg: '#e0052622' },
      { name: 'AWS',         icon: 'devicon-amazonwebservices-plain-wordmark colored', bg: '#ff990022' },
      { name: 'Azure',       icon: 'devicon-azure-plain colored',                     bg: '#0078d422' },
      { name: 'CI/CD',       icon: 'devicon-githubactions-plain colored',             bg: '#2088ff22' },
      { name: 'Bash',        icon: 'devicon-bash-plain colored',                      bg: '#29304422' },
      { name: 'Networking',  icon: null, emoji: '🌐',                                 bg: '#00cfff22' },
    ]
  },
  {
    id: 'monitoring',
    label: 'Monitoring & Observability',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    glow: 'rgba(249,115,22,0.35)',
    textColor: '#fff7ed',
    span: 'half',
    skills: [
      { name: 'Prometheus',     icon: 'devicon-prometheus-original colored', bg: '#e6522c22' },
      { name: 'Grafana',        icon: 'devicon-grafana-plain colored',        bg: '#f4600022' },
      { name: 'Elasticsearch',  icon: 'devicon-elasticsearch-plain colored',  bg: '#00bfb322' },
    ]
  },
  {
    id: 'languages',
    label: 'Languages & Databases',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
    glow: 'rgba(139,92,246,0.35)',
    textColor: '#fdf4ff',
    span: 'half',
    skills: [
      { name: 'Python',           icon: 'devicon-python-plain colored',      bg: '#3776ab22' },
      { name: 'Java',             icon: 'devicon-java-plain colored',        bg: '#5382a122' },
      { name: 'SQL / PostgreSQL', icon: 'devicon-postgresql-plain colored',  bg: '#33698122' },
      { name: 'MongoDB',          icon: 'devicon-mongodb-plain colored',     bg: '#47a24822' },
      { name: 'Redis',            icon: 'devicon-redis-plain colored',       bg: '#dc382d22' },
    ]
  },
  {
    id: 'os',
    label: 'Operating Systems & Tools',
    gradient: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
    glow: 'rgba(16,185,129,0.35)',
    textColor: '#ecfdf5',
    span: 'wide',
    skills: [
      { name: 'Linux',    icon: 'devicon-linux-plain',                bg: '#fcc62422' },
      { name: 'Windows',  icon: 'devicon-windows8-original colored',  bg: '#0078d422' },
      { name: 'Nginx',    icon: 'devicon-nginx-original colored',     bg: '#00915822' },
      { name: 'Vagrant',  icon: 'devicon-vagrant-plain colored',      bg: '#1868f222' },
    ]
  }
];

async function runMigration() {
  try {
    console.log('Starting migration...');

    // 1. Create skill_categories table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS skill_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id VARCHAR(100) UNIQUE NOT NULL,
        label VARCHAR(255) NOT NULL,
        gradient VARCHAR(255),
        glow VARCHAR(255),
        textColor VARCHAR(255),
        span VARCHAR(50) DEFAULT 'half',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created skill_categories table.');

    // 2. Alter skills table (add new columns, gracefully ignoring if they already exist)
    try {
      await promisePool.execute('ALTER TABLE skills MODIFY category VARCHAR(100)');
    } catch (e) { console.warn('Could not modify category to VARCHAR', e.message); }

    try {
      await promisePool.execute('ALTER TABLE skills ADD COLUMN icon VARCHAR(255)');
    } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }
    
    try {
      await promisePool.execute('ALTER TABLE skills ADD COLUMN emoji VARCHAR(50)');
    } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }
    
    try {
      await promisePool.execute('ALTER TABLE skills ADD COLUMN bg VARCHAR(50)');
    } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') throw e; }
    
    console.log('Altered skills table.');

    // 3. Clear existing skills and categories to avoid duplicates during seed
    // Note: The user said "display all existing data". If there are custom skills in the DB, 
    // we should just add the ones from CATEGORIES if they don't exist.
    // For simplicity, we'll insert the categories.
    
    // Check if skill_categories is empty
    const [cats] = await promisePool.execute('SELECT COUNT(*) as count FROM skill_categories');
    if (cats[0].count === 0) {
      console.log('Seeding categories and static skills...');
      for (const cat of CATEGORIES) {
        // Insert Category
        await promisePool.execute(
          'INSERT INTO skill_categories (category_id, label, gradient, glow, textColor, span) VALUES (?, ?, ?, ?, ?, ?)',
          [cat.id, cat.label, cat.gradient, cat.glow, cat.textColor, cat.span]
        );

        // Insert Skills
        for (const skill of cat.skills) {
          // Check if skill exists
          const [existingSkill] = await promisePool.execute(
            'SELECT id FROM skills WHERE skill_name = ? AND category = ?',
            [skill.name, cat.id] // using category_id as the category link
          );

          if (existingSkill.length === 0) {
            await promisePool.execute(
              'INSERT INTO skills (skill_name, proficiency_level, category, icon, emoji, bg) VALUES (?, ?, ?, ?, ?, ?)',
              [skill.name, 'Intermediate', cat.id, skill.icon || null, skill.emoji || null, skill.bg || null]
            );
          } else {
            // Update existing with new fields
            await promisePool.execute(
              'UPDATE skills SET icon = ?, emoji = ?, bg = ? WHERE id = ?',
              [skill.icon || null, skill.emoji || null, skill.bg || null, existingSkill[0].id]
            );
          }
        }
      }
      console.log('Seed completed successfully.');
    } else {
      console.log('Categories already exist, skipping seed.');
    }

    console.log('Migration finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
