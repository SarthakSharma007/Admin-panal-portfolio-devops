import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaChevronDown,
  FaChevronUp,
  FaCode,
  FaEye,
  FaGithub,
  FaImage,
  FaLink,
  FaListOl,
  FaLightbulb,
  FaPalette,
  FaPlus,
  FaSave,
  FaSignOutAlt,
  FaStar,
  FaTimesCircle,
  FaTrash,
  FaUserCircle
} from 'react-icons/fa';
import api from '../services/api';
import { ThemeContext } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import PopoverColorPicker from './PopoverColorPicker';
import './AdminPanel.css';

const TABS = ['Home', 'About', 'Skills', 'Projects', 'Certifications', 'Experience', 'Education', 'Inbox'];

const BLOCK_PALETTES = [
  { name: 'Blue/Purple', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', glow: 'rgba(99,102,241,0.4)', textColor: '#e0f2fe' },
  { name: 'Orange/Red', gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', glow: 'rgba(249,115,22,0.35)', textColor: '#fff7ed' },
  { name: 'Purple/Pink', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', glow: 'rgba(139,92,246,0.35)', textColor: '#fdf4ff' },
  { name: 'Green/Blue', gradient: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)', glow: 'rgba(16,185,129,0.35)', textColor: '#ecfdf5' },
  { name: 'Dark Monokai', gradient: 'linear-gradient(135deg, #2d2a2e 0%, #1a191a 100%)', glow: 'rgba(0,0,0,0.5)', textColor: '#fcfcfa' },
];

const SKILL_COLORS = [
  '#2496ed22', '#f0502422', '#47a24822', '#7b42bc22', '#e6522c22', '#fcc62422', '#00bfb322', '#29304422'
];

const newItem = {
  skillCategories: { category_id: '', label: '', gradient: '', glow: '', textColor: '', span: 'half' },
  skills: { name: '', level: 'Intermediate', category: '', icon: '', emoji: '', bg: '' },
  projects: {
    title: '', description: '', tech_stack: '', github_link: '', demo_link: '', image_url: '', featured: false,
    slug: '', num: '', label: '', short_desc: '', gradient: 'linear-gradient(135deg, #1a1040 0%, #312e81 50%, #1e3a5f 100%)',
    accent_a: '#818cf8', accent_b: '#38bdf8', hero: false,
    overview: '', problem: '', solution: '',
    tech_stack_json: [], timeline_json: [], learnings_json: []
  },
  certifications: { name: '', issuing_organization: '', issue_date: '', credential_id: '' },
  experiences: { title: '', company: '', location: '', start_date: '', end_date: '', current: false, description: '', technologies: '', type: 'Internship' },
  education: { degree: '', institution: '', location: '', start_date: '', end_date: '', current: false, gpa: '', description: '' }
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  const [activeTab, setActiveTab] = useState('Home');
  const [loading, setLoading] = useState({ page: true });
  const [status, setStatus] = useState({});
  const [autoRedirect, setAutoRedirect] = useState(false);

  // Fields shown on the portfolio Home page hero (+ profile_image for upload)
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    title: '',
    github_url: '',
    linkedin_url: '',
    profile_image: '',
  });
  const [imagePreview, setImagePreview] = useState(null); // local blob URL for new upload
  const [aboutImagePreview, setAboutImagePreview] = useState(null); // local blob URL for new about upload
  const [skillsHeader, setSkillsHeader] = useState({ subtitle: '', title: '', title_highlight: '', title_gradient: '', description: '' });
  const [projectsHeader, setProjectsHeader] = useState({ subtitle: '', title: '', title_highlight: '', title_gradient: '', description: '' });
  const [skillCategories, setSkillCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [collapsedProjects, setCollapsedProjects] = useState({});
  const [certifications, setCertifications] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState({ profile_image: null, about_image: null });

  const unreadCount = useMemo(() => messages.filter((m) => !m.read_status).length, [messages]);

  const showStatus = (key, type, text) => {
    setStatus((prev) => ({ ...prev, [key]: { type, text } }));
    setTimeout(() => {
      setStatus((prev) => ({ ...prev, [key]: null }));
    }, 4000);
  };

  const maybeRedirect = () => {
    if (!autoRedirect) return;
    setTimeout(() => navigate('/'), 650);
  };

  const toggleLoading = (key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const mapCert = (cert) => ({
    ...cert,
    name: cert.name || cert.cert_name || ''
  });

  const fetchAll = async () => {
    try {
      toggleLoading('page', true);
      const [
        infoRes,
        skillCatsRes,
        skillsRes,
        projectsRes,
        certsRes,
        expRes,
        eduRes,
        messagesRes,
        skillsHeaderRes,
        projectsHeaderRes
      ] = await Promise.all([
        api.get('/personal-info'),
        api.get('/skillCategories').catch(() => ({ data: { data: [] } })),
        api.get('/skills'),
        api.get('/projects/admin/all').catch(() => api.get('/projects')),
        api.get('/certifications'),
        api.get('/experiences'),
        api.get('/education'),
        api.get('/messages'),
        api.get('/sectionSettings/skills').catch(() => ({ data: { data: null } })),
        api.get('/sectionSettings/projects').catch(() => ({ data: { data: null } }))
      ]);

      if (infoRes.data?.success && infoRes.data.data) {
        // Load all fields to preserve them (like email, bio) for the save payload
        setPersonalInfo(infoRes.data.data);
      }
      setSkillCategories(skillCatsRes.data?.data || []);
      setSkills(skillsRes.data?.data || []);
      setProjects(projectsRes.data?.data || []);
      setCertifications((certsRes.data?.data || []).map(mapCert));
      setExperiences(expRes.data?.data || []);
      setEducation(eduRes.data?.data || []);
      setMessages(messagesRes.data?.data || []);
      if (skillsHeaderRes.data?.data) {
        setSkillsHeader(skillsHeaderRes.data.data);
      }
      if (projectsHeaderRes.data?.data) {
        setProjectsHeader(projectsHeaderRes.data.data);
      }
    } catch (error) {
      showStatus('page', 'error', 'Failed to load admin data.');
    } finally {
      toggleLoading('page', false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchAll();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const handleObjectField = (setter, field, value) => {
    setter((prev) => ({ ...prev, [field]: value }));
  };

  const handleListField = (setter, index, field, value) => {
    setter((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addListItem = (setter, key) => {
    setter((prev) => [...prev, { ...newItem[key], id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }]);
  };

  const savePersonalInfo = async () => {
    try {
      toggleLoading('personal', true);
      // Use FormData so we can send a file when an image is selected
      const formData = new FormData();
      Object.keys(personalInfo).forEach((key) => {
        if (key !== 'profile_image' && key !== 'about_image') { // Don't append string profile_image/about_image to formData
          formData.append(key, personalInfo[key] || '');
        }
      });
      if (files.profile_image) {
        formData.append('profile_image', files.profile_image);
      }
      if (files.about_image) {
        formData.append('about_image', files.about_image);
      }
      const res = await api.put('/personal-info', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        const d = res.data.data || {};
        setPersonalInfo(prev => ({
          ...prev,
          ...d, // Merge all returned fields back into state
        }));
        // Clear the pending file + local preview after successful upload
        setFiles(prev => ({ ...prev, profile_image: null, about_image: null }));
        setImagePreview(null);
        setAboutImagePreview(null);
        showStatus('personal', 'success', 'Home page info saved successfully.');
        maybeRedirect();
      } else {
        showStatus('personal', 'error', res.data?.message || 'Unable to save.');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Unable to save.';
      showStatus('personal', 'error', `Error: ${msg}`);
      console.error('Save home info error:', error);
    } finally {
      toggleLoading('personal', false);
    }
  };

  const saveCollection = (key, state, setter, endpoint, normalize = (x) => x) => async () => {
    try {
      toggleLoading(key, true);
      const updated = [];
      for (const item of state) {
        const { id, ...payload } = normalize(item);
        if (!id || id.toString().startsWith('new-')) {
          const res = await api.post(endpoint, payload);
          updated.push(res.data?.data || { ...payload, ...(res.data || {}) });
        } else {
          await api.put(`${endpoint}/${id}`, payload);
          updated.push({ id, ...payload });
        }
      }
      setter(updated);
      showStatus(key, 'success', `${key} saved successfully.`);
      maybeRedirect();
    } catch (error) {
      showStatus(key, 'error', `Failed to save ${key}.`);
    } finally {
      toggleLoading(key, false);
    }
  };

  const removeListItem = async (key, state, setter, index, endpoint) => {
    const item = state[index];
    if (!item) return;
    if (!window.confirm('Delete this item?')) return;

    if (item.id?.toString().startsWith('new-')) {
      setter((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    try {
      await api.delete(`${endpoint}/${item.id}`);
      setter((prev) => prev.filter((_, i) => i !== index));
      showStatus(key, 'success', `${key} item removed.`);
      maybeRedirect();
    } catch (error) {
      showStatus(key, 'error', `Unable to delete ${key} item.`);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/messages/mark-all-read');
      setMessages((prev) => prev.map((m) => ({ ...m, read_status: 1 })));
    } catch (error) {
      showStatus('messages', 'error', 'Unable to mark messages as read.');
    }
  };

  const addCategory = () => {
    setSkillCategories((prev) => [...prev, { ...newItem.skillCategories, id: `new-${Date.now()}` }]);
  };

  const addSkillInCategory = (categoryId) => {
    setSkills((prev) => [...prev, { ...newItem.skills, category: categoryId, id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }]);
  };

  const saveSkillsHeader = async () => {
    toggleLoading('skillsHeader', true);
    try {
      await api.put('/sectionSettings/skills', skillsHeader);
      showStatus('skillsHeader', 'success', 'Skills header updated.');
      maybeRedirect();
    } catch (err) {
      showStatus('skillsHeader', 'error', 'Unable to save skills header.');
    } finally {
      toggleLoading('skillsHeader', false);
    }
  };

  const saveProjectsHeader = async () => {
    toggleLoading('projectsHeader', true);
    try {
      await api.put('/sectionSettings/projects', projectsHeader);
      showStatus('projectsHeader', 'success', 'Projects header updated.');
      maybeRedirect();
    } catch (err) {
      showStatus('projectsHeader', 'error', 'Unable to save projects header.');
    } finally {
      toggleLoading('projectsHeader', false);
    }
  };

  if (loading.page) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" /> Loading Admin Panel...
      </div>
    );
  }

  return (
    <div className={`admin-panel-layout ${theme}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Portfolio CMS</h2>
          <p>Manage your full portfolio content.</p>
        </div>
        <ul className="admin-sidebar-list">
          {TABS.map((tab) => (
            <li key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
              <span>{tab}</span>
              {tab === 'Inbox' && unreadCount > 0 ? <span className="sidebar-badge">{unreadCount}</span> : null}
            </li>
          ))}
        </ul>
      </aside>

      <main className="admin-main-content">
        <header className="admin-header">
          <h1>{activeTab}</h1>
          <div className="admin-header-actions">
            <button className="plain-icon-btn" onClick={markAllRead} title="Mark all messages as read">
              <FaBell />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            <ThemeToggle />
            <button className="go-live-button" onClick={() => navigate('/')}>
              <FaEye /> View Website
            </button>
            <label className="admin-toggle-inline">
              <input type="checkbox" checked={autoRedirect} onChange={(e) => setAutoRedirect(e.target.checked)} />
              Auto open after save
            </label>
            <button className="logout-button" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </header>

        {status.page && <p className={`status-message ${status.page.type}`}>{status.page.text}</p>}

        {activeTab === 'Home' && (
          <section className="admin-section">
            <p className="admin-section-desc">
              These fields appear on the <strong>Home</strong> page hero. Edit them here to update what visitors see first.
            </p>
            {status.personal && <p className={`status-message ${status.personal.type}`}>{status.personal.text}</p>}

            {/* ── Profile Image Upload ─────────────────────── */}
            <div className="home-image-upload-row">
              <div className="home-image-preview-wrap">
                {(imagePreview || personalInfo.profile_image) ? (
                  <img
                    className="home-image-preview"
                    src={imagePreview || `http://localhost:5000${personalInfo.profile_image}`}
                    alt="Profile preview"
                  />
                ) : (
                  <div className="home-image-placeholder">
                    <FaUserCircle size={56} />
                  </div>
                )}
              </div>
              <div className="home-image-upload-controls">
                <p className="home-image-label">Profile Image</p>
                <p className="home-image-hint">This is the hero photo shown on the Home page. PNG, JPG or WebP, max 5 MB.</p>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                  <label className="home-image-btn" htmlFor="home-profile-image-input">
                    <FaImage /> {files.profile_image ? 'Change Image' : 'Upload Image'}
                  </label>
                  <input
                    id="home-profile-image-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFiles(prev => ({ ...prev, profile_image: f }));
                      if (f) {
                        const url = URL.createObjectURL(f);
                        setImagePreview(url);
                      }
                    }}
                  />
                  {(files.profile_image || imagePreview) && (
                    <button
                      className="home-image-clear-btn"
                      onClick={() => { setFiles(prev => ({ ...prev, profile_image: null })); setImagePreview(null); }}
                      type="button"
                    >
                      <FaTimesCircle /> Remove
                    </button>
                  )}
                </div>
                {files.profile_image && (
                  <p className="home-image-filename">📎 {files.profile_image.name}</p>
                )}
              </div>
            </div>

            {/* ── Text Fields ──────────────────────────────── */}
            <div className="admin-grid two-col" style={{ marginTop: '1.2rem' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarthak Sharma"
                  value={personalInfo.full_name || ''}
                  onChange={(e) => handleObjectField(setPersonalInfo, 'full_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Title / Role</label>
                <input
                  type="text"
                  placeholder="e.g. DevOps Cloud Engineer"
                  value={personalInfo.title || ''}
                  onChange={(e) => handleObjectField(setPersonalInfo, 'title', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>GitHub URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/yourhandle"
                  value={personalInfo.github_url || ''}
                  onChange={(e) => handleObjectField(setPersonalInfo, 'github_url', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>LinkedIn URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={personalInfo.linkedin_url || ''}
                  onChange={(e) => handleObjectField(setPersonalInfo, 'linkedin_url', e.target.value)}
                />
              </div>
            </div>
            <button className="save-button" onClick={savePersonalInfo} disabled={loading.personal}>
              <FaSave /> {loading.personal ? 'Saving...' : 'Save Home Info'}
            </button>
          </section>
        )}

        {activeTab === 'About' && (
          <section className="admin-section">
            <p className="admin-section-desc">
              These fields appear on the <strong>About</strong> page. Edit your bio and the dedicated About section photo here.
            </p>
            {status.personal && <p className={`status-message ${status.personal.type}`}>{status.personal.text}</p>}

            {/* ── About Image Upload ─────────────────────── */}
            <div className="home-image-upload-row">
              <div className="home-image-preview-wrap">
                {(aboutImagePreview || personalInfo.about_image) ? (
                  <img
                    className="home-image-preview"
                    src={aboutImagePreview || `http://localhost:5000${personalInfo.about_image}`}
                    alt="About preview"
                  />
                ) : (
                  <div className="home-image-placeholder">
                    <FaUserCircle size={56} />
                  </div>
                )}
              </div>
              <div className="home-image-upload-controls">
                <p className="home-image-label">About Section Image</p>
                <p className="home-image-hint">This photo is shown on the About section only. PNG, JPG or WebP, max 5 MB.</p>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                  <label className="home-image-btn" htmlFor="about-profile-image-input">
                    <FaImage /> {files.about_image ? 'Change Image' : 'Upload Image'}
                  </label>
                  <input
                    id="about-profile-image-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFiles(prev => ({ ...prev, about_image: f }));
                      if (f) {
                        const url = URL.createObjectURL(f);
                        setAboutImagePreview(url);
                      }
                    }}
                  />
                  {(files.about_image || aboutImagePreview) && (
                    <button
                      className="home-image-clear-btn"
                      onClick={() => { setFiles(prev => ({ ...prev, about_image: null })); setAboutImagePreview(null); }}
                      type="button"
                    >
                      <FaTimesCircle /> Remove
                    </button>
                  )}
                </div>
                {files.about_image && (
                  <p className="home-image-filename">📎 {files.about_image.name}</p>
                )}
              </div>
            </div>

            {/* ── Bio Field ──────────────────────────────── */}
            <div className="admin-grid" style={{ marginTop: '1.2rem', gridTemplateColumns: '1fr' }}>
              <div className="form-group">
                <label>Bio / About Me</label>
                <textarea
                  rows="8"
                  placeholder="Tell visitors about yourself..."
                  value={personalInfo.bio || ''}
                  onChange={(e) => handleObjectField(setPersonalInfo, 'bio', e.target.value)}
                />
              </div>
            </div>

            <button className="save-button" onClick={savePersonalInfo} disabled={loading.personal}>
              <FaSave /> {loading.personal ? 'Saving...' : 'Save About Info'}
            </button>
          </section>
        )}

        {activeTab === 'Skills' && (
          <section className="admin-section">
            <div className="admin-category-block" style={{ border: '1px solid var(--border-color)', padding: '1rem', marginBottom: '2rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
              <h3>Skills Section Header</h3>
              {status.skillsHeader && <p className={`status-message ${status.skillsHeader.type}`}>{status.skillsHeader.text}</p>}
              <div className="admin-row" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Subtitle (e.g. MY TOOLKIT)</label>
                  <input value={skillsHeader.subtitle || ''} onChange={(e) => setSkillsHeader({ ...skillsHeader, subtitle: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Title Prefix (e.g. Technologies & )</label>
                  <input value={skillsHeader.title || ''} onChange={(e) => setSkillsHeader({ ...skillsHeader, title: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Title Highlight (e.g. Skills)</label>
                  <input value={skillsHeader.title_highlight || ''} onChange={(e) => setSkillsHeader({ ...skillsHeader, title_highlight: e.target.value })} />
                </div>
              </div>
              <div className="admin-row" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Highlight Gradient (or solid color)</label>
                  <input value={skillsHeader.title_gradient || ''} onChange={(e) => setSkillsHeader({ ...skillsHeader, title_gradient: e.target.value })} placeholder="linear-gradient(...)" />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Description</label>
                  <textarea value={skillsHeader.description || ''} onChange={(e) => setSkillsHeader({ ...skillsHeader, description: e.target.value })} style={{ height: '60px' }} />
                </div>
              </div>
              <button className="save-button" onClick={saveSkillsHeader} disabled={loading.skillsHeader} style={{ width: '200px' }}>
                <FaSave /> {loading.skillsHeader ? 'Saving...' : 'Save Header'}
              </button>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Skill Blocks & Categories</h3>
            {status.skills && <p className={`status-message ${status.skills.type}`}>{status.skills.text}</p>}
            {skillCategories.map((cat, catIndex) => (
              <div key={cat.id || catIndex} className="admin-category-block" style={{ border: '1px solid var(--border-color)', padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px' }}>
                <div className="admin-row" style={{ marginBottom: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Block ID (unique slug)</label>
                    <input value={cat.category_id || ''} placeholder="e.g. cloud" onChange={(e) => handleListField(setSkillCategories, catIndex, 'category_id', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Label / Title</label>
                    <input value={cat.label || ''} placeholder="e.g. Cloud & DevOps" onChange={(e) => handleListField(setSkillCategories, catIndex, 'label', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Span</label>
                    <select value={cat.span || 'half'} onChange={(e) => handleListField(setSkillCategories, catIndex, 'span', e.target.value)}>
                      <option value="half">Half Width</option>
                      <option value="wide">Full Width</option>
                    </select>
                  </div>
                  <button className="remove-button" onClick={() => removeListItem('skillCategories', skillCategories, setSkillCategories, catIndex, '/skillCategories')} style={{ marginTop: '24px' }}><FaTrash /></button>
                </div>
                
                <div className="admin-row" style={{ marginBottom: '0.5rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Gradient Background</label>
                    <input value={cat.gradient || ''} placeholder="linear-gradient(...)" onChange={(e) => handleListField(setSkillCategories, catIndex, 'gradient', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Glow Color</label>
                    <PopoverColorPicker color={cat.glow} onChange={(color) => handleListField(setSkillCategories, catIndex, 'glow', color)} placeholder="rgba(...,0.4)" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Text Color</label>
                    <PopoverColorPicker color={cat.textColor} onChange={(color) => handleListField(setSkillCategories, catIndex, 'textColor', color)} placeholder="#ffffff" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {BLOCK_PALETTES.map((p, idx) => (
                    <button 
                      key={idx} 
                      title={p.name}
                      onClick={() => {
                        handleListField(setSkillCategories, catIndex, 'gradient', p.gradient);
                        handleListField(setSkillCategories, catIndex, 'glow', p.glow);
                        handleListField(setSkillCategories, catIndex, 'textColor', p.textColor);
                      }}
                      style={{ background: p.gradient, width: '24px', height: '24px', borderRadius: '4px', border: 'none', cursor: 'pointer', boxShadow: `0 0 8px ${p.glow}` }}
                    />
                  ))}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem', alignSelf: 'center' }}>Click to apply block preset</span>
                </div>

                <h5 style={{ marginTop: '1rem', marginBottom: '0.5rem', opacity: 0.8 }}>Skills in this Block</h5>
                {skills.map((skill, skillIndex) => {
                  if (skill.category !== cat.category_id) return null;
                  return (
                    <div className="admin-row" key={skill.id || skillIndex} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', marginBottom: '0.5rem' }}>
                      <input style={{ flex: 1.5 }} value={skill.name || ''} placeholder="Skill name" onChange={(e) => handleListField(setSkills, skillIndex, 'name', e.target.value)} />
                      <input style={{ flex: 1.5 }} value={skill.icon || ''} placeholder="Devicon class (e.g. devicon-docker-plain)" onChange={(e) => handleListField(setSkills, skillIndex, 'icon', e.target.value)} />
                      <input style={{ flex: 0.5 }} value={skill.emoji || ''} placeholder="Emoji (if no icon)" onChange={(e) => handleListField(setSkills, skillIndex, 'emoji', e.target.value)} />
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <PopoverColorPicker color={skill.bg} onChange={(color) => handleListField(setSkills, skillIndex, 'bg', color)} placeholder="Tile bg color (e.g. #2496ed22)" />
                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                          {SKILL_COLORS.map(c => (
                            <div key={c} onClick={() => handleListField(setSkills, skillIndex, 'bg', c)} style={{ background: c, width: '16px', height: '16px', borderRadius: '4px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)' }} title={c} />
                          ))}
                        </div>
                      </div>
                      <button className="remove-button" onClick={() => removeListItem('skills', skills, setSkills, skillIndex, '/skills')}><FaTrash /></button>
                    </div>
                  );
                })}
                <button className="add-button-empty" onClick={() => addSkillInCategory(cat.category_id)} style={{ marginTop: '0.5rem' }}><FaPlus /> Add Skill to Block</button>
              </div>
            ))}
            
            <button className="add-button-empty" onClick={addCategory}><FaPlus /> Add New Block</button>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="save-button" onClick={saveCollection('skillCategories', skillCategories, setSkillCategories, '/skillCategories')} disabled={loading.skillCategories}>
                <FaSave /> {loading.skillCategories ? 'Saving...' : 'Save Blocks'}
              </button>
              <button className="save-button" onClick={saveCollection('skills', skills, setSkills, '/skills')} disabled={loading.skills}>
                <FaSave /> {loading.skills ? 'Saving...' : 'Save Skills'}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'Projects' && (
          <section className="admin-section">
            <div className="admin-category-block" style={{ border: '1px solid var(--border-color)', padding: '1rem', marginBottom: '2rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}>
              <h3>Projects Section Header</h3>
              {status.projectsHeader && <p className={`status-message ${status.projectsHeader.type}`}>{status.projectsHeader.text}</p>}
              <div className="admin-row" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Subtitle (e.g. What I've Built)</label>
                  <input value={projectsHeader.subtitle || ''} onChange={(e) => setProjectsHeader({ ...projectsHeader, subtitle: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Title Prefix (e.g. Featured )</label>
                  <input value={projectsHeader.title || ''} onChange={(e) => setProjectsHeader({ ...projectsHeader, title: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Title Highlight (e.g. Projects)</label>
                  <input value={projectsHeader.title_highlight || ''} onChange={(e) => setProjectsHeader({ ...projectsHeader, title_highlight: e.target.value })} />
                </div>
              </div>
              <div className="admin-row" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Highlight Gradient (or solid color)</label>
                  <input value={projectsHeader.title_gradient || ''} onChange={(e) => setProjectsHeader({ ...projectsHeader, title_gradient: e.target.value })} placeholder="linear-gradient(...)" />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Description</label>
                  <textarea value={projectsHeader.description || ''} onChange={(e) => setProjectsHeader({ ...projectsHeader, description: e.target.value })} style={{ height: '60px' }} />
                </div>
              </div>
              <button className="save-button" onClick={saveProjectsHeader} disabled={loading.projectsHeader} style={{ width: '200px' }}>
                <FaSave /> {loading.projectsHeader ? 'Saving...' : 'Save Header'}
              </button>
            </div>

            <h3 style={{ marginBottom: '0.4rem' }}>Individual Projects</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Each project card below matches one card on your portfolio page. Click the <strong>▼ header</strong> to expand/collapse. Fill in only what you need — the more you fill, the richer your detail page will look.
            </p>
            {status.projects && <p className={`status-message ${status.projects.type}`}>{status.projects.text}</p>}
            {projects.map((project, i) => {
              const tsItems = Array.isArray(project.tech_stack_json) ? project.tech_stack_json : [];
              const tlItems = Array.isArray(project.timeline_json)   ? project.timeline_json   : [];
              const lnItems = Array.isArray(project.learnings_json)  ? project.learnings_json  : [];
              const cardKey = project.id || `new-${i}`;
              const isCollapsed = collapsedProjects[cardKey] !== false; // default collapsed

              const updateSubList = (field, updater) => {
                setProjects(prev => prev.map((p, idx) => idx !== i ? p : { ...p, [field]: updater(Array.isArray(p[field]) ? p[field] : []) }));
              };
              const hf = (field, val) => handleListField(setProjects, i, field, val);

              return (
                <div key={cardKey} style={{ border: '2px solid var(--border-color)', borderRadius: '12px', marginBottom: '1.2rem', overflow: 'hidden' }}>

                  {/* ── Collapsible Header Bar ── */}
                  <div
                    onClick={() => setCollapsedProjects(prev => ({ ...prev, [cardKey]: !isCollapsed }))}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.1rem', background: 'var(--bg-secondary)', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{isCollapsed ? <FaChevronDown /> : <FaChevronUp />}</span>
                    <span style={{ fontWeight: 700, fontSize: '1rem', flex: 1 }}>
                      {project.title || <em style={{ opacity: 0.5 }}>Untitled Project</em>}
                    </span>
                    {project.num && <span style={{ fontSize: '0.78rem', background: 'rgba(99,102,241,0.15)', color: '#6366f1', borderRadius: '6px', padding: '2px 8px', fontWeight: 700 }}>#{project.num}</span>}
                    {project.featured && <span style={{ fontSize: '0.75rem', background: 'rgba(245,158,11,0.15)', color: '#d97706', borderRadius: '6px', padding: '2px 8px', fontWeight: 700 }}>⭐ Featured</span>}
                    {project.hero && <span style={{ fontSize: '0.75rem', background: 'rgba(139,92,246,0.15)', color: '#7c3aed', borderRadius: '6px', padding: '2px 8px', fontWeight: 700 }}>🦸 Hero</span>}
                    <button className="remove-button" style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                      onClick={(e) => { e.stopPropagation(); removeListItem('projects', projects, setProjects, i, '/projects'); }}>
                      <FaTrash /> Delete
                    </button>
                  </div>

                  {/* ── Expanded Body ── */}
                  {!isCollapsed && (
                    <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                      {/* SECTION 1 — Basic Info */}
                      <div style={{ border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(99,102,241,0.08)', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.88rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaStar /> Basic Information
                        </div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div className="admin-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                              <label>Project Title <span style={{ color: '#ef4444' }}>*</span></label>
                              <input value={project.title || ''} onChange={e => hf('title', e.target.value)} placeholder="e.g. CI/CD Pipeline & Kubernetes Deployment" />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>The main heading shown on your project card</small>
                            </div>
                            <div className="form-group">
                              <label>URL Slug</label>
                              <input value={project.slug || ''} onChange={e => hf('slug', e.target.value)} placeholder="e.g. cicd-kubernetes" />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Used in the detail page URL: /projects/<strong>slug</strong></small>
                            </div>
                            <div className="form-group">
                              <label>Display Number</label>
                              <input value={project.num || ''} onChange={e => hf('num', e.target.value)} placeholder="e.g. 01" />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Large ghost number shown in the card background</small>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                              <label>Category / Label</label>
                              <input value={project.label || ''} onChange={e => hf('label', e.target.value)} placeholder="e.g. DevOps · CI/CD" />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Small badge shown above the project title on the card</small>
                            </div>
                            <div className="form-group">
                              <label>Tech Stack Tags</label>
                              <input value={project.tech_stack || ''} onChange={e => hf('tech_stack', e.target.value)} placeholder="Docker, Kubernetes, Node.js" />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Comma-separated tags shown as small pills on the card</small>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Short Description <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(shown on the project card)</span></label>
                            <textarea value={project.short_desc || ''} onChange={e => hf('short_desc', e.target.value)} style={{ height: '70px' }} placeholder="Write 2-3 sentences summarising what the project does and why it matters..." />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>This text appears below the title on the main Projects page card</small>
                          </div>
                          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            <label className="checkbox-label" style={{ gap: '0.6rem' }}>
                              <input type="checkbox" checked={!!project.featured} onChange={e => hf('featured', e.target.checked)} />
                              <span><strong>Featured</strong> — show on the main projects page</span>
                            </label>
                            <label className="checkbox-label" style={{ gap: '0.6rem' }}>
                              <input type="checkbox" checked={!!project.hero} onChange={e => hf('hero', e.target.checked)} />
                              <span><strong>Hero Card</strong> — make this the large featured card at the top (only one should be hero)</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2 — Links */}
                      <div style={{ border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(16,185,129,0.08)', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.88rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaLink /> Links & Media
                        </div>
                        <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                          <div className="form-group">
                            <label><FaGithub style={{ marginRight: 4 }} />GitHub Repository URL</label>
                            <input value={project.github_link || ''} onChange={e => hf('github_link', e.target.value)} placeholder="https://github.com/username/repo" />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>The GitHub button on the card links here</small>
                          </div>
                          <div className="form-group">
                            <label>Live Demo URL</label>
                            <input value={project.demo_link || ''} onChange={e => hf('demo_link', e.target.value)} placeholder="https://myapp.netlify.app" />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Optional — if no slug, the "See More" button links here instead</small>
                          </div>
                          <div className="form-group">
                            <label>Preview Image URL</label>
                            <input value={project.image_url || ''} onChange={e => hf('image_url', e.target.value)} placeholder="https://..." />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Optional project thumbnail / screenshot URL</small>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3 — Visual Style */}
                      <div style={{ border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(245,158,11,0.08)', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.88rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaPalette /> Visual Style (Card Colors)
                        </div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div className="form-group">
                            <label>Card Background Gradient</label>
                            <input value={project.gradient || ''} onChange={e => hf('gradient', e.target.value)} placeholder="linear-gradient(135deg, #1a1040 0%, #312e81 50%, #1e3a5f 100%)" />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>The dark gradient background of the whole project card. Use <a href="https://cssgradient.io" target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>cssgradient.io</a> to create one visually.</small>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                              <label>Accent Color A (Primary)</label>
                              <PopoverColorPicker color={project.accent_a || '#818cf8'} onChange={c => hf('accent_a', c)} />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Used for the label badge, tag borders, button glow, and orb highlight</small>
                            </div>
                            <div className="form-group">
                              <label>Accent Color B (Secondary)</label>
                              <PopoverColorPicker color={project.accent_b || '#38bdf8'} onChange={c => hf('accent_b', c)} />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Used for the second decorative orb colour on the card</small>
                            </div>
                          </div>
                          <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Live preview:</span>
                            <div style={{ width: 120, height: 32, borderRadius: '6px', background: project.gradient || '#1a1040', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: project.accent_a || '#818cf8' }} />
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: project.accent_b || '#38bdf8' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 4 — Detail Page Content */}
                      <div style={{ border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(139,92,246,0.08)', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.88rem', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaCode /> Detail Page Content
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>Shown when visitor clicks "See More"</span>
                        </div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div className="form-group">
                            <label>Overview</label>
                            <textarea value={project.overview || ''} onChange={e => hf('overview', e.target.value)} style={{ height: '90px' }} placeholder="Describe what the project is, what it does, and who would use it. Aim for 3-5 sentences." />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Big intro paragraph at the top of the detail page</small>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                              <label>The Problem</label>
                              <textarea value={project.problem || ''} onChange={e => hf('problem', e.target.value)} style={{ height: '80px' }} placeholder="What pain point or challenge prompted this project? What was wrong before?" />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Shown in a side-by-side block with "The Solution"</small>
                            </div>
                            <div className="form-group">
                              <label>The Solution</label>
                              <textarea value={project.solution || ''} onChange={e => hf('solution', e.target.value)} style={{ height: '80px' }} placeholder="How did your project solve the problem? What approach did you take?" />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Explains your approach and why it works</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 5 — Tech Stack Details */}
                      <div style={{ border: '1px solid rgba(6,182,212,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(6,182,212,0.08)', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.88rem', color: '#0891b2', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaCode /> Tech Stack Details ({tsItems.length} {tsItems.length === 1 ? 'entry' : 'entries'})
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>Each entry = one card on the detail page</span>
                        </div>
                        <div style={{ padding: '1rem' }}>
                          {tsItems.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>No tech stack entries yet. Click "Add Technology" to explain each tool you used.</p>
                          )}
                          {tsItems.map((ts, ti) => (
                            <div key={ti} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '0.5rem 0.6rem' }}>
                              <input value={ts.name || ''} placeholder="Technology (e.g. Docker)" onChange={e => updateSubList('tech_stack_json', list => list.map((x, xi) => xi === ti ? { ...x, name: e.target.value } : x))} style={{ fontWeight: 600 }} />
                              <input value={ts.purpose || ''} placeholder="What you used it for (e.g. Containerising the Node.js app)" onChange={e => updateSubList('tech_stack_json', list => list.map((x, xi) => xi === ti ? { ...x, purpose: e.target.value } : x))} />
                              <button className="remove-button" style={{ padding: '4px 8px' }} title="Remove this technology" onClick={() => updateSubList('tech_stack_json', list => list.filter((_, xi) => xi !== ti))}><FaTrash /></button>
                            </div>
                          ))}
                          <button className="add-button-empty" style={{ marginTop: '0.4rem' }} onClick={() => updateSubList('tech_stack_json', list => [...list, { name: '', purpose: '' }])}>
                            <FaPlus /> Add Technology
                          </button>
                        </div>
                      </div>

                      {/* SECTION 6 — Timeline */}
                      <div style={{ border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(16,185,129,0.07)', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.88rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaListOl /> Build Timeline ({tlItems.length} {tlItems.length === 1 ? 'step' : 'steps'})
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>"How It Was Built" section on the detail page</span>
                        </div>
                        <div style={{ padding: '1rem' }}>
                          {tlItems.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>No steps yet. Add the key phases of how you built this project.</p>
                          )}
                          {tlItems.map((tl, ti) => (
                            <div key={ti} style={{ display: 'grid', gridTemplateColumns: '55px 1fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '0.5rem 0.6rem' }}>
                              <input value={tl.step || ''} placeholder="01" title="Step number" onChange={e => updateSubList('timeline_json', list => list.map((x, xi) => xi === ti ? { ...x, step: e.target.value } : x))} style={{ textAlign: 'center', fontWeight: 700 }} />
                              <input value={tl.title || ''} placeholder="Step title (e.g. Write Dockerfile)" onChange={e => updateSubList('timeline_json', list => list.map((x, xi) => xi === ti ? { ...x, title: e.target.value } : x))} />
                              <textarea value={tl.desc || ''} placeholder="What you did in this step..." style={{ height: '52px' }} onChange={e => updateSubList('timeline_json', list => list.map((x, xi) => xi === ti ? { ...x, desc: e.target.value } : x))} />
                              <button className="remove-button" style={{ padding: '4px 8px', marginTop: '2px' }} title="Remove this step" onClick={() => updateSubList('timeline_json', list => list.filter((_, xi) => xi !== ti))}><FaTrash /></button>
                            </div>
                          ))}
                          <button className="add-button-empty" style={{ marginTop: '0.4rem' }} onClick={() => updateSubList('timeline_json', list => [...list, { step: String(list.length + 1).padStart(2, '0'), title: '', desc: '' }])}>
                            <FaPlus /> Add Step
                          </button>
                        </div>
                      </div>

                      {/* SECTION 7 — Learnings */}
                      <div style={{ border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(245,158,11,0.07)', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.88rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaLightbulb /> Key Learnings ({lnItems.length})
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>Shown as bullet points with checkmarks</span>
                        </div>
                        <div style={{ padding: '1rem' }}>
                          {lnItems.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>No learnings yet. Add what you learned or accomplished from this project.</p>
                          )}
                          {lnItems.map((ln, li) => (
                            <div key={li} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                              <input value={ln || ''} placeholder={`e.g. How to configure GitHub Actions secrets for Docker Hub (entry ${li + 1})`} onChange={e => updateSubList('learnings_json', list => list.map((x, xi) => xi === li ? e.target.value : x))} />
                              <button className="remove-button" style={{ padding: '4px 8px' }} title="Remove this learning" onClick={() => updateSubList('learnings_json', list => list.filter((_, xi) => xi !== li))}><FaTrash /></button>
                            </div>
                          ))}
                          <button className="add-button-empty" style={{ marginTop: '0.4rem' }} onClick={() => updateSubList('learnings_json', list => [...list, ''])}>
                            <FaPlus /> Add Learning
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button className="add-button-empty" style={{ flex: 1 }} onClick={() => {
                addListItem(setProjects, 'projects');
                // auto-expand the new card
                const newKey = `new-${projects.length}`;
                setCollapsedProjects(prev => ({ ...prev, [newKey]: false }));
              }}>
                <FaPlus /> Add New Project
              </button>
              <button className="save-button" style={{ flex: 2 }} onClick={saveCollection('projects', projects, setProjects, '/projects', (p) => ({
                ...p,
                tech_stack_json: p.tech_stack_json || [],
                timeline_json: p.timeline_json || [],
                learnings_json: p.learnings_json || []
              }))} disabled={loading.projects}>
                <FaSave /> {loading.projects ? 'Saving all projects...' : 'Save All Projects'}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'Certifications' && (
          <section className="admin-section">
            {status.certifications && <p className={`status-message ${status.certifications.type}`}>{status.certifications.text}</p>}
            {certifications.map((cert, i) => (
              <div className="admin-list-item-column" key={cert.id || i}>
                <div className="form-group">
                  <label>Name</label>
                  <input value={cert.name || ''} onChange={(e) => handleListField(setCertifications, i, 'name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Organization</label>
                  <input value={cert.issuing_organization || ''} onChange={(e) => handleListField(setCertifications, i, 'issuing_organization', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Issue date</label>
                  <input type="date" value={cert.issue_date ? cert.issue_date.split('T')[0] : ''} onChange={(e) => handleListField(setCertifications, i, 'issue_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Credential ID</label>
                  <input value={cert.credential_id || ''} onChange={(e) => handleListField(setCertifications, i, 'credential_id', e.target.value)} />
                </div>
                <button className="remove-button" onClick={() => removeListItem('certifications', certifications, setCertifications, i, '/certifications')}><FaTrash /></button>
              </div>
            ))}
            <button className="add-button-empty" onClick={() => addListItem(setCertifications, 'certifications')}><FaPlus /> Add certification</button>
            <button className="save-button" onClick={saveCollection('certifications', certifications, setCertifications, '/certifications')} disabled={loading.certifications}>
              <FaSave /> {loading.certifications ? 'Saving...' : 'Save Certifications'}
            </button>
          </section>
        )}

        {activeTab === 'Experience' && (
          <section className="admin-section">
            {status.experiences && <p className={`status-message ${status.experiences.type}`}>{status.experiences.text}</p>}
            {experiences.map((exp, i) => (
              <div className="admin-list-item-column" key={exp.id || i}>
                {['title', 'company', 'location', 'type', 'technologies'].map((field) => (
                  <div className="form-group" key={field}>
                    <label>{field.replaceAll('_', ' ')}</label>
                    <input value={exp[field] || ''} onChange={(e) => handleListField(setExperiences, i, field, e.target.value)} />
                  </div>
                ))}
                <div className="form-group">
                  <label>Start date</label>
                  <input type="date" value={exp.start_date ? exp.start_date.split('T')[0] : ''} onChange={(e) => handleListField(setExperiences, i, 'start_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>End date</label>
                  <input type="date" value={exp.end_date ? exp.end_date.split('T')[0] : ''} onChange={(e) => handleListField(setExperiences, i, 'end_date', e.target.value)} />
                </div>
                <label className="checkbox-label span-2">
                  <input type="checkbox" checked={!!exp.current} onChange={(e) => handleListField(setExperiences, i, 'current', e.target.checked)} />
                  Current role
                </label>
                <div className="form-group span-2">
                  <label>Description</label>
                  <textarea value={exp.description || ''} onChange={(e) => handleListField(setExperiences, i, 'description', e.target.value)} />
                </div>
                <button className="remove-button" onClick={() => removeListItem('experiences', experiences, setExperiences, i, '/experiences')}><FaTrash /></button>
              </div>
            ))}
            <button className="add-button-empty" onClick={() => addListItem(setExperiences, 'experiences')}><FaPlus /> Add experience</button>
            <button className="save-button" onClick={saveCollection('experiences', experiences, setExperiences, '/experiences')} disabled={loading.experiences}>
              <FaSave /> {loading.experiences ? 'Saving...' : 'Save Experience'}
            </button>
          </section>
        )}

        {activeTab === 'Education' && (
          <section className="admin-section">
            {status.education && <p className={`status-message ${status.education.type}`}>{status.education.text}</p>}
            {education.map((edu, i) => (
              <div className="admin-list-item-column" key={edu.id || i}>
                {['degree', 'institution', 'location', 'gpa'].map((field) => (
                  <div className="form-group" key={field}>
                    <label>{field.replaceAll('_', ' ')}</label>
                    <input value={edu[field] || ''} onChange={(e) => handleListField(setEducation, i, field, e.target.value)} />
                  </div>
                ))}
                <div className="form-group">
                  <label>Start date</label>
                  <input type="date" value={edu.start_date ? edu.start_date.split('T')[0] : ''} onChange={(e) => handleListField(setEducation, i, 'start_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>End date</label>
                  <input type="date" value={edu.end_date ? edu.end_date.split('T')[0] : ''} onChange={(e) => handleListField(setEducation, i, 'end_date', e.target.value)} />
                </div>
                <label className="checkbox-label span-2">
                  <input type="checkbox" checked={!!edu.current} onChange={(e) => handleListField(setEducation, i, 'current', e.target.checked)} />
                  Current study
                </label>
                <div className="form-group span-2">
                  <label>Description</label>
                  <textarea value={edu.description || ''} onChange={(e) => handleListField(setEducation, i, 'description', e.target.value)} />
                </div>
                <button className="remove-button" onClick={() => removeListItem('education', education, setEducation, i, '/education')}><FaTrash /></button>
              </div>
            ))}
            <button className="add-button-empty" onClick={() => addListItem(setEducation, 'education')}><FaPlus /> Add education</button>
            <button className="save-button" onClick={saveCollection('education', education, setEducation, '/education')} disabled={loading.education}>
              <FaSave /> {loading.education ? 'Saving...' : 'Save Education'}
            </button>
          </section>
        )}

        {activeTab === 'Inbox' && (
          <section className="admin-section">
            {status.messages && <p className={`status-message ${status.messages.type}`}>{status.messages.text}</p>}
            {messages.length === 0 && <p>No messages yet.</p>}
            {messages.map((msg, i) => (
              <div className="admin-list-item-column" key={msg.id || i}>
                <div className="message-header">
                  <strong>{msg.name}</strong>
                  <span>{msg.email}</span>
                </div>
                <p><strong>Subject:</strong> {msg.subject || 'No subject'}</p>
                <p>{msg.message}</p>
                <small>{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</small>
                <button className="remove-button" onClick={() => removeListItem('messages', messages, setMessages, i, '/messages')}><FaTrash /></button>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
