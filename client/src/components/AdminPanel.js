import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaEllipsisV,
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
  FaMagic,
  FaCheck,
  FaExternalLinkAlt,
  FaPalette,
  FaPlus,
  FaSave,
  FaSignOutAlt,
  FaStar,
  FaTimesCircle,
  FaTrash,
  FaUserCircle,
  FaPen,
  FaAlignLeft,
  FaFilePdf
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

const TagsInput = ({ value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        const newTag = inputValue.trim().replace(/,/g, '');
        if (newTag && !tags.includes(newTag)) {
          onChange(value ? `${value}, ${newTag}` : newTag);
        }
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1).join(', '));
    }
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, i) => i !== indexToRemove).join(', '));
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '6px', minHeight: '42px', alignItems: 'center', background: 'var(--bg-primary)' }}>
      {tags.map((tag, i) => (
        <span key={i} style={{ background: '#e5e7eb', padding: '3px 10px', borderRadius: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          {tag}
          <FaTimesCircle style={{ cursor: 'pointer', color: '#9ca3af', fontSize: '0.8rem' }} onClick={() => removeTag(i)} />
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) {
            const newTag = inputValue.trim().replace(/,/g, '');
            if (newTag && !tags.includes(newTag)) {
              onChange(value ? `${value}, ${newTag}` : newTag);
            }
            setInputValue('');
          }
        }}
        style={{ border: 'none', outline: 'none', flex: 1, minWidth: '150px', fontSize: '0.85rem', padding: '0.2rem', background: 'transparent', color: 'var(--text-primary)' }}
        placeholder={tags.length === 0 ? placeholder : ""}
      />
    </div>
  );
};

const newItem = {
  skillCategories: { category_id: '', label: '', gradient: '', glow: '', textColor: '', span: 'half' },
  skills: { name: '', level: 'Intermediate', category: '', icon: '', emoji: '', bg: '' },
  projects: {
    title: '', description: '', tech_stack: '', github_link: '', demo_link: '', image_url: '', featured: false,
    slug: '', num: '', label: '', short_desc: '', gradient: 'linear-gradient(135deg, #1a1040 0%, #312e81 50%, #1e3a5f 100%)',
    accent_a: '#818cf8', accent_b: '#38bdf8', hero: false,
    overview: '', problem: '', solution: '',
    tech_stack_json: [], timeline_json: [], learnings_json: [],
    show_github: true, show_demo: true, show_details: true
  },
  certifications: { name: '', issuing_organization: '', issue_date: '', credential_id: '' },
  experiences: { title: '', company: '', location: '', start_date: '', end_date: '', current: false, description: '', technologies: '', type: 'Internship' },
  education: { degree: '', institution: '', location: '', start_date: '', end_date: '', current: false, gpa: '', description: '' }
};

const getAdminAssetUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  // In production, REACT_APP_API_URL is set to the deployed backend URL (e.g. Render).
  // The Vercel vercel.json rewrite handles /uploads/:path* → backend, so relative works too.
  if (process.env.REACT_APP_API_URL) {
    const base = process.env.REACT_APP_API_URL.replace(/\/+$/, '');
    return `${base}${cleanPath}`;
  }
  // Local development: Admin Panel backend runs on port 5001
  return `http://localhost:5001${cleanPath}`;
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  const [activeTab, setActiveTab] = useState('Home');
  const [loading, setLoading] = useState({ page: true });
  const [status, setStatus] = useState({});
  const [autoRedirect, setAutoRedirect] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const headerMenuRef = useRef(null);
  const isSavingRef = useRef(new Set());

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setShowHeaderMenu(false);
      }
    };
    if (showHeaderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHeaderMenu]);

  // Fields shown on the portfolio Home page hero (+ profile_image for upload)
  const [personalInfo, setPersonalInfo] = useState({
    full_name: '',
    title: '',
    bio: '',
    resume_url: '',
    github_url: '',
    linkedin_url: '',
    profile_image: '',
    about_image: '',
    greeting_text: '',
    greeting_color: '',
    name_color: '',
    title_color: '',
    github_btn_text: '',
    github_btn_bg: '',
    github_btn_color: '',
    linkedin_btn_text: '',
    linkedin_btn_bg: '',
    linkedin_btn_color: '',
    about_github_btn_text: '',
    about_github_btn_bg: '',
    about_github_btn_color: '',
    about_linkedin_btn_text: '',
    about_linkedin_btn_bg: '',
    about_linkedin_btn_color: '',
    about_resume_btn_text: '',
    about_resume_btn_bg: '',
    about_resume_btn_color: ''
  });
  const [imagePreview, setImagePreview] = useState(null); // local blob URL for new upload
  const [aboutImagePreview, setAboutImagePreview] = useState(null); // local blob URL for new about upload
  const [skillsHeader, setSkillsHeader] = useState({ subtitle: '', title: '', title_highlight: '', title_gradient: '', description: '' });
  const [projectsHeader, setProjectsHeader] = useState({ subtitle: '', title: '', title_highlight: '', title_gradient: '', description: '' });
  const [showProjectsGradientInput, setShowProjectsGradientInput] = useState(false);
  const [showSkillsGradientInput, setShowSkillsGradientInput] = useState(false);
  const [skillCategories, setSkillCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [collapsedProjects, setCollapsedProjects] = useState({});
  const [certifications, setCertifications] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState({ profile_image: null, about_image: null, resume_file: null });

  const unreadCount = useMemo(() => messages.filter((m) => !m.read_status).length, [messages]);

  const showStatus = (key, type, text) => {
    setStatus((prev) => ({ ...prev, [key]: { type, text } }));
    setTimeout(() => {
      setStatus((prev) => ({ ...prev, [key]: null }));
    }, 4000);
  };

  const handleImageUpload = async (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/projects/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        callback(res.data.url);
      } else {
        alert(res.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("Failed to upload image");
    }
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
      if (files.resume_file) {
        formData.append('resume_file', files.resume_file);
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
        setFiles(prev => ({ ...prev, profile_image: null, about_image: null, resume_file: null }));
        setImagePreview(null);
        setAboutImagePreview(null);
        showStatus('personal', 'success', 'Personal & About info saved successfully.');
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

  const normalizeExperience = (exp) => ({
    ...exp,
    start_date: exp.start_date ? exp.start_date.toString().split('T')[0] : '',
    end_date: exp.end_date ? exp.end_date.toString().split('T')[0] : '',
    current: exp.current ? 1 : 0
  });

  const normalizeEducation = (edu) => ({
    ...edu,
    start_date: edu.start_date ? edu.start_date.toString().split('T')[0] : '',
    end_date: edu.end_date ? edu.end_date.toString().split('T')[0] : '',
    current: edu.current ? 1 : 0
  });

  const saveCollection = (key, state, setter, endpoint, normalize = (x) => x) => async () => {
    if (isSavingRef.current.has(key)) {
      return;
    }
    isSavingRef.current.add(key);
    try {
      toggleLoading(key, true);
      const updated = [];
      for (const item of state) {
        const { id, created_at, updated_at, ...rawPayload } = normalize(item);
        const payload = rawPayload;
        if (!id || id.toString().startsWith('new-')) {
          const res = await api.post(endpoint, payload);
          updated.push(res.data?.data || { ...payload, ...(res.data || {}) });
        } else {
          await api.put(`${endpoint}/${id}`, payload);
          updated.push({ id, ...payload });
        }
      }
      setter(updated);

      // Re-fetch fresh state from backend to guarantee 100% sync with DB
      try {
        const freshRes = await api.get(endpoint);
        if (freshRes.data?.data && Array.isArray(freshRes.data.data)) {
          let freshList = freshRes.data.data;
          if (key === 'certifications') freshList = freshList.map(mapCert);
          setter(freshList);
        }
      } catch (e) { }

      showStatus(key, 'success', `${key} saved successfully.`);
      maybeRedirect();
    } catch (error) {
      try {
        const freshRes = await api.get(endpoint);
        if (freshRes.data?.data && Array.isArray(freshRes.data.data)) {
          let freshList = freshRes.data.data;
          if (key === 'certifications') freshList = freshList.map(mapCert);
          setter(freshList);
        }
      } catch (e) { }
      showStatus(key, 'error', `Failed to save ${key}.`);
    } finally {
      isSavingRef.current.delete(key);
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

  const generateSmartPalette = () => {
    const palettes = [
      { greeting: '#94a3b8', name: '#38bdf8', title: '#818cf8', githubBg: '#0f172a', githubText: '#38bdf8', linkedinBg: '#0284c7', linkedinText: '#f0f9ff' },
      { greeting: '#a1a1aa', name: '#fb923c', title: '#f43f5e', githubBg: '#18181b', githubText: '#fb923c', linkedinBg: '#e11d48', linkedinText: '#fff1f2' },
      { greeting: '#9ca3af', name: '#34d399', title: '#10b981', githubBg: '#111827', githubText: '#34d399', linkedinBg: '#059669', linkedinText: '#ecfdf5' },
      { greeting: '#a8a29e', name: '#c084fc', title: '#a855f7', githubBg: '#1c1917', githubText: '#c084fc', linkedinBg: '#9333ea', linkedinText: '#faf5ff' },
      { greeting: '#86868b', name: '#f59e0b', title: '#d97706', githubBg: '#000000', githubText: '#f59e0b', linkedinBg: '#b45309', linkedinText: '#fffbeb' },
      { greeting: '#64748b', name: '#e879f9', title: '#2dd4bf', githubBg: '#1e293b', githubText: '#2dd4bf', linkedinBg: '#4f46e5', linkedinText: '#e0e7ff' }
    ];
    const randomPalette = palettes[Math.floor(Math.random() * palettes.length)];
    setPersonalInfo(prev => ({
      ...prev,
      greeting_color: randomPalette.greeting,
      name_color: randomPalette.name,
      title_color: randomPalette.title,
      github_btn_bg: randomPalette.githubBg,
      github_btn_color: randomPalette.githubText,
      linkedin_btn_bg: randomPalette.linkedinBg,
      linkedin_btn_color: randomPalette.linkedinText
    }));
  };

  const generateIndividualPalette = (fieldGroup) => {
    const textColors = ['#38bdf8', '#fb923c', '#34d399', '#c084fc', '#f59e0b', '#2dd4bf', '#f43f5e', '#818cf8', '#a855f7', '#10b981', '#ef4444', '#0ea5e9'];
    const buttonStyles = [
      { bg: '#0f172a', text: '#38bdf8' },
      { bg: '#18181b', text: '#fb923c' },
      { bg: '#111827', text: '#34d399' },
      { bg: '#1c1917', text: '#c084fc' },
      { bg: '#000000', text: '#f59e0b' },
      { bg: '#0284c7', text: '#f0f9ff' },
      { bg: '#e11d48', text: '#fff1f2' },
      { bg: '#059669', text: '#ecfdf5' },
      { bg: '#9333ea', text: '#faf5ff' },
      { bg: '#b45309', text: '#fffbeb' }
    ];

    setPersonalInfo(prev => {
      const updated = { ...prev };
      if (['greeting', 'name', 'title'].includes(fieldGroup)) {
        updated[`${fieldGroup}_color`] = textColors[Math.floor(Math.random() * textColors.length)];
      } else if (fieldGroup === 'github') {
        const style = buttonStyles[Math.floor(Math.random() * buttonStyles.length)];
        updated.github_btn_bg = style.bg;
        updated.github_btn_color = style.text;
      } else if (fieldGroup === 'linkedin' || fieldGroup === 'about_linkedin') {
        const style = buttonStyles[Math.floor(Math.random() * buttonStyles.length)];
        const prefix = fieldGroup.startsWith('about_') ? 'about_linkedin' : 'linkedin';
        updated[`${prefix}_btn_bg`] = style.bg;
        updated[`${prefix}_btn_color`] = style.text;
      } else if (fieldGroup === 'about_github') {
        const style = buttonStyles[Math.floor(Math.random() * buttonStyles.length)];
        updated.about_github_btn_bg = style.bg;
        updated.about_github_btn_color = style.text;
      } else if (fieldGroup === 'about_resume') {
        const style = buttonStyles[Math.floor(Math.random() * buttonStyles.length)];
        updated.about_resume_btn_bg = style.bg;
        updated.about_resume_btn_color = style.text;
      } else if (fieldGroup === 'about_all') {
        const s1 = buttonStyles[Math.floor(Math.random() * buttonStyles.length)];
        const s2 = buttonStyles[Math.floor(Math.random() * buttonStyles.length)];
        const s3 = buttonStyles[Math.floor(Math.random() * buttonStyles.length)];
        updated.about_github_btn_bg = s1.bg;
        updated.about_github_btn_color = s1.text;
        updated.about_linkedin_btn_bg = s2.bg;
        updated.about_linkedin_btn_color = s2.text;
        updated.about_resume_btn_bg = s3.bg;
        updated.about_resume_btn_color = s3.text;
      }
      return updated;
    });
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
          <div className="admin-header-actions" style={{ position: 'relative' }} ref={headerMenuRef}>
            <button className="plain-icon-btn" onClick={markAllRead} title="Mark all messages as read">
              <FaBell />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            <button className="plain-icon-btn" onClick={() => setShowHeaderMenu(!showHeaderMenu)} title="More actions">
              <FaEllipsisV />
            </button>

            {showHeaderMenu && (
              <div
                className="header-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: '0',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem',
                  boxShadow: 'var(--shadow-medium)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  zIndex: 100,
                  minWidth: '220px',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Theme</span>
                  <ThemeToggle />
                </div>
                <div style={{ width: '100%', height: '1px', background: 'var(--border-color)' }} />
                <label className="admin-toggle-inline" style={{ margin: 0, width: '100%', cursor: 'pointer' }}>
                  <input type="checkbox" checked={autoRedirect} onChange={(e) => setAutoRedirect(e.target.checked)} />
                  <span style={{ fontSize: '0.9rem' }}>Auto open after save</span>
                </label>
                <button className="go-live-button" onClick={() => { setShowHeaderMenu(false); navigate('/'); }} style={{ width: '100%', justifyContent: 'center' }}>
                  <FaEye /> View Website
                </button>
                <button className="logout-button" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {status.page && <p className={`status-message ${status.page.type}`}>{status.page.text}</p>}

        {activeTab === 'Home' && (
          <section className="admin-section" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            {/* Banner */}
            <div style={{ background: 'var(--bg-secondary)', borderLeft: '4px solid #6366f1', padding: '1rem 1.5rem', borderRadius: '0 8px 8px 0', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <FaHome style={{ color: '#6366f1', fontSize: '1.2rem' }} />
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                These fields appear on the <strong style={{ color: 'var(--text-primary)' }}>Home</strong> page hero. Edit them here to update what visitors see first.
              </p>
            </div>

            {status.personal && <p className={`status-message ${status.personal.type}`}>{status.personal.text}</p>}

            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem', boxShadow: 'var(--shadow-light)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>Profile Information</h3>

              {/* Profile Image Upload */}
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--bg-primary)', boxShadow: 'var(--shadow-medium)', flexShrink: 0, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(imagePreview || personalInfo.profile_image) ? (
                    <img
                      src={imagePreview || getAdminAssetUrl(personalInfo.profile_image)}
                      alt="Profile preview"
                      onError={(e) => {
                        if (e.target.src && e.target.src.includes(':5001')) {
                          e.target.src = e.target.src.replace(':5001', ':5000');
                        }
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <FaUserCircle size={56} color="var(--text-muted)" />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Profile Image</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>This is the hero photo shown on the Home page. PNG, JPG or WebP, max 5 MB.</p>
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem', alignItems: 'center' }}>
                    <label style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '0.5rem 1.2rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', transition: '0.2s' }}>
                      <FaImage style={{ color: '#6366f1' }} /> {files.profile_image ? 'Change Image' : 'Upload Image'}
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: 'none' }} onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setFiles(prev => ({ ...prev, profile_image: f }));
                        if (f) {
                          const url = URL.createObjectURL(f);
                          setImagePreview(url);
                        }
                      }} />
                    </label>
                    {(files.profile_image || imagePreview) && (
                      <button type="button" onClick={() => { setFiles(prev => ({ ...prev, profile_image: null })); setImagePreview(null); }} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <FaTimesCircle /> Remove
                      </button>
                    )}
                    {files.profile_image && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📎 {files.profile_image.name}</span>}
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Full Name</label>
                  <input type="text" placeholder="e.g. Sarthak Sharma" value={personalInfo.full_name || ''} onChange={(e) => handleObjectField(setPersonalInfo, 'full_name', e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Title / Role</label>
                  <input type="text" placeholder="e.g. DevOps Cloud Engineer" value={personalInfo.title || ''} onChange={(e) => handleObjectField(setPersonalInfo, 'title', e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>GitHub URL</label>
                  <input type="url" placeholder="https://github.com/yourhandle" value={personalInfo.github_url || ''} onChange={(e) => handleObjectField(setPersonalInfo, 'github_url', e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>LinkedIn URL</label>
                  <input type="url" placeholder="https://linkedin.com/in/yourprofile" value={personalInfo.linkedin_url || ''} onChange={(e) => handleObjectField(setPersonalInfo, 'linkedin_url', e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                </div>
              </div>

              {/* Hero Customizations */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2.5rem 0 1.5rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Hero Customizations</h3>
                <button type="button" onClick={generateSmartPalette} style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)' }}>
                  <FaMagic /> AI Smart Palette
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Greeting Text</label>
                  <input type="text" placeholder="e.g. Hello, I'm" value={personalInfo.greeting_text || ''} onChange={(e) => handleObjectField(setPersonalInfo, 'greeting_text', e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <PopoverColorPicker color={personalInfo.greeting_color || '#000000'} onChange={(color) => handleObjectField(setPersonalInfo, 'greeting_color', color)} />
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Greeting Color</label>
                  <button type="button" onClick={() => generateIndividualPalette('greeting')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', padding: '0 0.5rem' }} title="AI Randomize"><FaMagic /></button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <PopoverColorPicker color={personalInfo.name_color || '#000000'} onChange={(color) => handleObjectField(setPersonalInfo, 'name_color', color)} />
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Name Color</label>
                  <button type="button" onClick={() => generateIndividualPalette('name')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', padding: '0 0.5rem' }} title="AI Randomize"><FaMagic /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <PopoverColorPicker color={personalInfo.title_color || '#000000'} onChange={(color) => handleObjectField(setPersonalInfo, 'title_color', color)} />
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Title/Role Color</label>
                  <button type="button" onClick={() => generateIndividualPalette('title')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', padding: '0 0.5rem' }} title="AI Randomize"><FaMagic /></button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>GitHub Button</h4>
                <button type="button" onClick={() => generateIndividualPalette('github')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', padding: '0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }} title="AI Randomize"><FaMagic /> Auto Color</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Button Text</label>
                  <input type="text" placeholder="e.g. GitHub" value={personalInfo.github_btn_text || ''} onChange={(e) => handleObjectField(setPersonalInfo, 'github_btn_text', e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <PopoverColorPicker color={personalInfo.github_btn_bg || '#000000'} onChange={(color) => handleObjectField(setPersonalInfo, 'github_btn_bg', color)} />
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Background</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <PopoverColorPicker color={personalInfo.github_btn_color || '#ffffff'} onChange={(color) => handleObjectField(setPersonalInfo, 'github_btn_color', color)} />
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Text Color</label>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>LinkedIn Button</h4>
                <button type="button" onClick={() => generateIndividualPalette('linkedin')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', padding: '0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }} title="AI Randomize"><FaMagic /> Auto Color</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Button Text</label>
                  <input type="text" placeholder="e.g. LinkedIn" value={personalInfo.linkedin_btn_text || ''} onChange={(e) => handleObjectField(setPersonalInfo, 'linkedin_btn_text', e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <PopoverColorPicker color={personalInfo.linkedin_btn_bg || '#0077b5'} onChange={(color) => handleObjectField(setPersonalInfo, 'linkedin_btn_bg', color)} />
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Background</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                  <PopoverColorPicker color={personalInfo.linkedin_btn_color || '#ffffff'} onChange={(color) => handleObjectField(setPersonalInfo, 'linkedin_btn_color', color)} />
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Text Color</label>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button onClick={savePersonalInfo} disabled={loading.personal} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', color: '#fff', border: 'none', padding: '0.75rem 2.5rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)', minWidth: '180px', justifyContent: 'center' }}>
                  <FaSave style={{ fontSize: '1.1rem' }} /> {loading.personal ? 'Saving...' : 'Save Home Info'}
                </button>
              </div>
            </div>
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
                    src={aboutImagePreview || getAdminAssetUrl(personalInfo.about_image)}
                    alt="About preview"
                    onError={(e) => {
                      if (e.target.src && e.target.src.includes(':5001')) {
                        e.target.src = e.target.src.replace(':5001', ':5000');
                      }
                    }}
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

            {/* About Customizations */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2.5rem 0 1.5rem 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>About Customizations</h3>
              <button type="button" onClick={() => generateIndividualPalette('about_all')} style={{ background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)' }}>
                <FaMagic /> AI Smart Palette
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>GitHub Button</h4>
              <button type="button" onClick={() => generateIndividualPalette('about_github')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', padding: '0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }} title="AI Randomize"><FaMagic /> Auto Color</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Button Text</label>
                <input type="text" placeholder="e.g. GitHub" value={personalInfo.about_github_btn_text || ''} onChange={(e) => handleObjectField(setPersonalInfo, 'about_github_btn_text', e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <PopoverColorPicker color={personalInfo.about_github_btn_bg || '#000000'} onChange={(color) => handleObjectField(setPersonalInfo, 'about_github_btn_bg', color)} />
                <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Background</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <PopoverColorPicker color={personalInfo.about_github_btn_color || '#ffffff'} onChange={(color) => handleObjectField(setPersonalInfo, 'about_github_btn_color', color)} />
                <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Text Color</label>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>LinkedIn Button</h4>
              <button type="button" onClick={() => generateIndividualPalette('about_linkedin')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', padding: '0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }} title="AI Randomize"><FaMagic /> Auto Color</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Button Text</label>
                <input type="text" placeholder="e.g. LinkedIn" value={personalInfo.about_linkedin_btn_text || ''} onChange={(e) => handleObjectField(setPersonalInfo, 'about_linkedin_btn_text', e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <PopoverColorPicker color={personalInfo.about_linkedin_btn_bg || '#0077b5'} onChange={(color) => handleObjectField(setPersonalInfo, 'about_linkedin_btn_bg', color)} />
                <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Background</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <PopoverColorPicker color={personalInfo.about_linkedin_btn_color || '#ffffff'} onChange={(color) => handleObjectField(setPersonalInfo, 'about_linkedin_btn_color', color)} />
                <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Text Color</label>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2rem', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>Resume Button</h4>
              <button type="button" onClick={() => generateIndividualPalette('about_resume')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', padding: '0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }} title="AI Randomize"><FaMagic /> Auto Color</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Button Text</label>
                <input type="text" placeholder="e.g. Resume" value={personalInfo.about_resume_btn_text || ''} onChange={(e) => handleObjectField(setPersonalInfo, 'about_resume_btn_text', e.target.value)} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <PopoverColorPicker color={personalInfo.about_resume_btn_bg || '#ef4444'} onChange={(color) => handleObjectField(setPersonalInfo, 'about_resume_btn_bg', color)} />
                <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Background</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <PopoverColorPicker color={personalInfo.about_resume_btn_color || '#ffffff'} onChange={(color) => handleObjectField(setPersonalInfo, 'about_resume_btn_color', color)} />
                <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Text Color</label>
              </div>
            </div>

            {/* ── Resume / CV PDF Upload & URL Block ───────────── */}
            <div className="resume-card-wrapper" style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--shadow-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <FaFilePdf style={{ color: '#ef4444', fontSize: '1.3rem' }} />
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Resume PDF File & Link
                </h4>
              </div>
              <p style={{ margin: '0 0 1.2rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Upload your resume PDF directly to your portfolio, or provide an external link (such as Google Drive). Visitors clicking the <strong>Resume</strong> button on your portfolio will open or download this file.
              </p>

              {/* Upload control row */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.8rem',
                padding: '1rem',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                border: '1px dashed var(--border-color)',
                marginBottom: '1rem'
              }}>
                <label
                  htmlFor="resume-pdf-input"
                  className="resume-upload-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.2rem',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1.5px solid #ef4444',
                    color: '#ef4444',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <FaFilePdf /> {files.resume_file ? 'Change PDF File' : (personalInfo.resume_url ? 'Upload New Resume PDF' : 'Upload Resume PDF')}
                </label>
                <input
                  id="resume-pdf-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                        alert('Please select a valid PDF file.');
                        return;
                      }
                      setFiles(prev => ({ ...prev, resume_file: file }));
                    }
                  }}
                />

                {files.resume_file && (
                  <button
                    type="button"
                    onClick={() => setFiles(prev => ({ ...prev, resume_file: null }))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.6rem 0.9rem',
                      borderRadius: '8px',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <FaTimesCircle /> Discard Selection
                  </button>
                )}

                {files.resume_file && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    fontSize: '0.83rem',
                    fontWeight: 500
                  }}>
                    📎 Selected: <strong>{files.resume_file.name}</strong> ({(files.resume_file.size / 1024).toFixed(1)} KB) — click <em>Save About Info</em> below to upload
                  </div>
                )}
              </div>

              {/* Current Resume Preview / Link Card */}
              {personalInfo.resume_url && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  padding: '0.85rem 1.2rem',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '220px', flex: 1 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ef4444',
                      fontSize: '1.2rem',
                      flexShrink: 0
                    }}>
                      <FaFilePdf />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Active Resume
                      </div>
                      <div style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        maxWidth: '450px'
                      }}>
                        {personalInfo.resume_url}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                    <a
                      href={getAdminAssetUrl(personalInfo.resume_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 0.9rem',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} /> View / Download
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove the current resume link/file? Click "Save About Info" to finalize.')) {
                          setPersonalInfo(prev => ({ ...prev, resume_url: '' }));
                          setFiles(prev => ({ ...prev, resume_file: null }));
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      <FaTrash style={{ fontSize: '0.75rem' }} /> Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Direct URL input */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem', display: 'block' }}>
                  Resume URL / File Path
                </label>
                <input
                  type="text"
                  placeholder="e.g. /uploads/resume.pdf or https://drive.google.com/file/d/..."
                  value={personalInfo.resume_url || ''}
                  onChange={(e) => handleObjectField(setPersonalInfo, 'resume_url', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.92rem'
                  }}
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
            <div className="admin-category-block" style={{ border: '1px solid var(--border-color)', padding: '1.5rem', marginBottom: '2rem', borderRadius: '12px', background: 'var(--bg-secondary)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Skills Section Header</h3>
                <FaPen style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }} />
              </div>
              {status.skillsHeader && <p className={`status-message ${status.skillsHeader.type}`}>{status.skillsHeader.text}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Subtitle (e.g. MY TOOLKIT)</label>
                  <input value={skillsHeader.subtitle || ''} onChange={(e) => setSkillsHeader({ ...skillsHeader, subtitle: e.target.value })} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Title Prefix (e.g. Technologies & )</label>
                  <input value={skillsHeader.title || ''} onChange={(e) => setSkillsHeader({ ...skillsHeader, title: e.target.value })} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Title Highlight (e.g. Skills)</label>
                  <input value={skillsHeader.title_highlight || ''} onChange={(e) => setSkillsHeader({ ...skillsHeader, title_highlight: e.target.value })} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div className="form-group" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <FaAlignLeft style={{ color: 'var(--text-secondary)' }} /> Description
                  </label>
                  <textarea value={skillsHeader.description || ''} onChange={(e) => setSkillsHeader({ ...skillsHeader, description: e.target.value })} style={{ flex: 1, minHeight: '130px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }} />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <FaPalette style={{ color: 'var(--text-secondary)' }} /> Highlight Style (or solid color)
                  </label>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{
                        height: '100px',
                        background: skillsHeader.title_gradient || 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                        borderRadius: '8px',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                      }}></div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[
                          'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                          'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                          'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                          'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          'linear-gradient(135deg, #6B7280 0%, #374151 100%)'
                        ].map((grad, i) => (
                          <div
                            key={i}
                            onClick={() => setSkillsHeader({ ...skillsHeader, title_gradient: grad })}
                            style={{
                              width: '32px', height: '24px', borderRadius: '6px', background: grad,
                              cursor: 'pointer', border: skillsHeader.title_gradient === grad ? '2px solid #2563EB' : '1px solid var(--border-color)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '130px' }}>
                      <button
                        onClick={() => setShowSkillsGradientInput(!showSkillsGradientInput)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)', padding: '0.5rem 0.8rem', borderRadius: '6px',
                          fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)'
                        }}>
                        <FaPalette style={{ color: '#ec4899', fontSize: '1rem' }} /> Edit
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Customize or select a preset.</span>
                    </div>
                  </div>

                  {showSkillsGradientInput && (
                    <input
                      style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%' }}
                      value={skillsHeader.title_gradient || ''}
                      onChange={(e) => setSkillsHeader({ ...skillsHeader, title_gradient: e.target.value })}
                      placeholder="e.g. linear-gradient(to right, #ff0000, #00ff00)"
                    />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  className="save-button"
                  onClick={saveSkillsHeader}
                  disabled={loading.skillsHeader}
                  style={{ background: '#3B82F6', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', width: 'auto', minWidth: '120px', justifyContent: 'center' }}
                >
                  <FaSave style={{ fontSize: '0.9rem' }} /> {loading.skillsHeader ? 'Saving...' : 'Save Header'}
                </button>
              </div>
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
            <div className="admin-category-block" style={{ border: '1px solid var(--border-color)', padding: '1.5rem', marginBottom: '2rem', borderRadius: '12px', background: 'var(--bg-secondary)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Projects Section Header</h3>
                <FaPen style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }} />
              </div>
              {status.projectsHeader && <p className={`status-message ${status.projectsHeader.type}`}>{status.projectsHeader.text}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Subtitle (e.g. What I've Built)</label>
                  <input value={projectsHeader.subtitle || ''} onChange={(e) => setProjectsHeader({ ...projectsHeader, subtitle: e.target.value })} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Title Prefix (e.g. Featured)</label>
                  <input value={projectsHeader.title || ''} onChange={(e) => setProjectsHeader({ ...projectsHeader, title: e.target.value })} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Title Highlight (e.g. Projects)</label>
                  <input value={projectsHeader.title_highlight || ''} onChange={(e) => setProjectsHeader({ ...projectsHeader, title_highlight: e.target.value })} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div className="form-group" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <FaAlignLeft style={{ color: 'var(--text-secondary)' }} /> Description
                  </label>
                  <textarea value={projectsHeader.description || ''} onChange={(e) => setProjectsHeader({ ...projectsHeader, description: e.target.value })} style={{ flex: 1, minHeight: '130px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }} />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <FaPalette style={{ color: 'var(--text-secondary)' }} /> Highlight Style (or solid color)
                  </label>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{
                        height: '100px',
                        background: projectsHeader.title_gradient || 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                        borderRadius: '8px',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                      }}></div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[
                          'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                          'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                          'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
                          'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          'linear-gradient(135deg, #6B7280 0%, #374151 100%)'
                        ].map((grad, i) => (
                          <div
                            key={i}
                            onClick={() => setProjectsHeader({ ...projectsHeader, title_gradient: grad })}
                            style={{
                              width: '32px', height: '24px', borderRadius: '6px', background: grad,
                              cursor: 'pointer', border: projectsHeader.title_gradient === grad ? '2px solid #2563EB' : '1px solid var(--border-color)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '130px' }}>
                      <button
                        onClick={() => setShowProjectsGradientInput(!showProjectsGradientInput)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)', padding: '0.5rem 0.8rem', borderRadius: '6px',
                          fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)'
                        }}>
                        <FaPalette style={{ color: '#ec4899', fontSize: '1rem' }} /> Edit
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Customize or select a preset.</span>
                    </div>
                  </div>

                  {showProjectsGradientInput && (
                    <input
                      style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%' }}
                      value={projectsHeader.title_gradient || ''}
                      onChange={(e) => setProjectsHeader({ ...projectsHeader, title_gradient: e.target.value })}
                      placeholder="e.g. linear-gradient(to right, #ff0000, #00ff00)"
                    />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                  className="save-button"
                  onClick={saveProjectsHeader}
                  disabled={loading.projectsHeader}
                  style={{ background: '#3B82F6', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', width: 'auto', minWidth: '120px', justifyContent: 'center' }}
                >
                  <FaSave style={{ fontSize: '0.9rem' }} /> {loading.projectsHeader ? 'Saving...' : 'Save Header'}
                </button>
              </div>
            </div>

            <h3 style={{ marginBottom: '0.4rem' }}>Individual Projects</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Each project card below matches one card on your portfolio page. Click the <strong>▼ header</strong> to expand/collapse. Fill in only what you need — the more you fill, the richer your detail page will look.
            </p>
            {status.projects && <p className={`status-message ${status.projects.type}`}>{status.projects.text}</p>}
            {projects.map((project, i) => {
              const tsItems = Array.isArray(project.tech_stack_json) ? project.tech_stack_json : [];
              const tlItems = Array.isArray(project.timeline_json) ? project.timeline_json : [];
              const lnItems = Array.isArray(project.learnings_json) ? project.learnings_json : [];
              const imItems = Array.isArray(project.images_json) ? project.images_json : [];
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
                    {project.num != null && project.num !== '' && (
                      <span style={{ fontSize: '0.8rem', background: 'rgba(99,102,241,0.15)', color: '#4f46e5', borderRadius: '6px', padding: '2px 10px', fontWeight: 700 }}>
                        #{project.num}
                      </span>
                    )}
                    {project.featured && (
                      <span style={{ fontSize: '0.8rem', background: 'rgba(245,158,11,0.15)', color: '#d97706', borderRadius: '6px', padding: '2px 10px', fontWeight: 700 }}>
                        ⭐ Featured
                      </span>
                    )}
                    <button
                      style={{
                        padding: '4px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                        background: 'rgba(220, 38, 38, 0.12)', color: '#ef4444', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
                      }}
                      onClick={(e) => { e.stopPropagation(); removeListItem('projects', projects, setProjects, i, '/projects'); }}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>

                  {/* ── Expanded Body ── */}
                  {!isCollapsed && (
                    <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                      {/* SECTION 1 — Basic Info */}
                      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1.2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaStar style={{ color: '#6366f1', fontSize: '1.2rem' }} />
                            <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Basic Information</span>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Featured</span>
                            <div
                              onClick={() => hf('featured', !project.featured)}
                              style={{ width: '36px', height: '20px', background: project.featured ? '#10b981' : '#d1d5db', borderRadius: '20px', position: 'relative', transition: '0.3s' }}
                            >
                              <div style={{ width: '16px', height: '16px', background: 'var(--bg-primary)', borderRadius: '50%', position: 'absolute', top: '2px', left: project.featured ? '18px' : '2px', transition: '0.3s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                            </div>
                          </label>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {/* Row 1 */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>Project Title <span style={{ color: '#ef4444' }}>*</span></label>
                              <input value={project.title || ''} onChange={e => { hf('title', e.target.value); if (!project.slug || project.slug === (project.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) { hf('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); } }} placeholder="DevOps CI/CD Pipeline" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--bg-primary)' }} />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>Main heading for your project card.</small>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>URL Slug</label>
                              <input value={project.slug || ''} onChange={e => hf('slug', e.target.value)} placeholder="e.g. cicd-kubernetes" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--bg-primary)' }} />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>Auto-generated from title. Edit to customize: /projects/{project.slug || 'your-slug'}</small>
                            </div>
                          </div>

                          {/* Row 2 */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>Display Number</label>
                              <input value={project.num || ''} onChange={e => hf('num', e.target.value)} placeholder="e.g. 01" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--bg-primary)' }} />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>Large ghost number on the card background.</small>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>Card Size</label>
                              <div style={{ position: 'relative' }}>
                                <select value={project.card_size || 'Medium'} onChange={e => hf('card_size', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--bg-secondary)', appearance: 'none', cursor: 'pointer' }}>
                                  <option value="Small">Small</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Large">Large</option>
                                  <option value="Extra Large">Extra Large</option>
                                  <option value="Hero">Hero (Full Width)</option>
                                </select>
                                <FaChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none', fontSize: '0.8rem' }} />
                              </div>
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>Select how large this project appears on the grid.</small>
                            </div>
                          </div>

                          {/* Row 3 */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>Category / Label</label>
                              <input value={project.label || ''} onChange={e => hf('label', e.target.value)} placeholder="e.g. DevOps · CI/CD" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--bg-primary)' }} />
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>Badge displayed above the project title.</small>
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>Difficulty Level</label>
                              <div style={{ position: 'relative' }}>
                                <select value={project.difficulty_level || 'Basic'} onChange={e => hf('difficulty_level', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--bg-secondary)', appearance: 'none', cursor: 'pointer' }}>
                                  <option value="Basic">Basic</option>
                                  <option value="Intermediate">Intermediate</option>
                                  <option value="Advanced">Advanced</option>
                                </select>
                                <FaChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none', fontSize: '0.8rem' }} />
                              </div>
                              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>Level badge shown on the card.</small>
                            </div>
                          </div>

                          {/* Row 4 */}
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>Tech Stack Tags</label>
                            <TagsInput value={project.tech_stack || ''} onChange={val => hf('tech_stack', val)} placeholder="e.g. Jenkins, Docker, Kubernetes" />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>Comma-separated tags as small pills.</small>
                          </div>

                          {/* Row 5 */}
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem', display: 'block' }}>Short Description (shown on the project card)</label>
                            <textarea value={project.short_desc || ''} onChange={e => hf('short_desc', e.target.value)} style={{ width: '100%', minHeight: '80px', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)', resize: 'vertical', background: 'var(--bg-primary)' }} placeholder="Write 2-3 sentences summarizing the project's function and purpose." />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', display: 'block' }}>Write 2-3 sentences summarizing the project's function and purpose.</small>
                          </div>

                        </div>
                      </div>

                      {/* SECTION 2 — Links */}
                      <div style={{ border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(16,185,129,0.08)', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.88rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaLink /> Links & Media
                        </div>
                        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                          <div className="form-group">
                            <label><FaGithub style={{ marginRight: 4 }} />GitHub Repository URL</label>
                            <input value={project.github_link || ''} onChange={e => hf('github_link', e.target.value)} placeholder="https://github.com/username/repo" />
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>The GitHub button on the card links here</small>
                          </div>
                          <div className="form-group">
                            <label>Live Demo URL</label>
                            <input value={project.demo_link || ''} onChange={e => hf('demo_link', e.target.value)} placeholder="https://myapp.netlify.app" />
                          </div>
                          <div className="form-group span-2">
                            <label><FaImage style={{ marginRight: 4 }} />Thumbnail Image</label>
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                              <input value={project.image_url || ''} onChange={e => hf('image_url', e.target.value)} placeholder="URL or upload a local file..." style={{ flex: 1 }} />
                              <label className="home-image-btn" style={{ padding: '0.85rem 1.2rem', cursor: 'pointer', margin: 0 }}>
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, (url) => hf('image_url', url))} />
                                Browse...
                              </label>
                            </div>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>Main project preview image</small>
                          </div>
                          <div className="form-group span-2" style={{ margin: 0, marginTop: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.8rem', display: 'block' }}>Button Visibility on Card</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1.2rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', margin: 0 }}>
                                <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }} checked={project.show_github !== false && project.show_github !== 0 && project.show_github !== '0'} onChange={e => hf('show_github', e.target.checked)} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Show <strong>GitHub</strong> Button</span>
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', margin: 0 }}>
                                <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }} checked={project.show_demo !== false && project.show_demo !== 0 && project.show_demo !== '0'} onChange={e => hf('show_demo', e.target.checked)} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Show <strong>Live Demo</strong> Button</span>
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', margin: 0 }}>
                                <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }} checked={project.show_details !== false && project.show_details !== 0 && project.show_details !== '0'} onChange={e => hf('show_details', e.target.checked)} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Show <strong>See More</strong> Button</span>
                              </label>
                            </div>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.6rem', display: 'block' }}>Toggle whether these buttons appear on the project card. (They still require the URL/slug to exist to show up)</small>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3 — Visual Style */}
                      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaPalette style={{ color: '#7c3aed', fontSize: '1.2rem' }} />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Visual Style</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Customize the visual appearance of your project cards.</p>
                          </div>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                              <FaMagic style={{ color: '#7c3aed', fontSize: '1rem' }} />
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Card Background Gradient</span>
                            </div>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Set the gradient background for the entire project card.</p>

                            {/* Advanced Color Selectors for Gradient */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>Gradient Start Color</label>
                                <PopoverColorPicker
                                  color={(project.gradient || '').match(/#[0-9a-fA-F]{3,6}/g)?.[0] || '#1a1040'}
                                  onChange={c => {
                                    const gradStr = project.gradient || '';
                                    const hexes = gradStr.match(/#[0-9a-fA-F]{3,6}/g) || [];
                                    const end = hexes.length > 1 ? hexes[hexes.length - 1] : '#1e3a5f';
                                    hf('gradient', `linear-gradient(135deg, ${c} 0%, ${end} 100%)`);
                                  }}
                                  inputStyle={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                                  customSwatchStyle={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 1 }}
                                  customColorStyle={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>Gradient End Color</label>
                                <PopoverColorPicker
                                  color={(project.gradient || '').match(/#[0-9a-fA-F]{3,6}/g)?.pop() || '#1e3a5f'}
                                  onChange={c => {
                                    const gradStr = project.gradient || '';
                                    const hexes = gradStr.match(/#[0-9a-fA-F]{3,6}/g) || [];
                                    const start = hexes[0] || '#1a1040';
                                    hf('gradient', `linear-gradient(135deg, ${start} 0%, ${c} 100%)`);
                                  }}
                                  inputStyle={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                                  customSwatchStyle={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 1 }}
                                  customColorStyle={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                              <input
                                value={project.gradient || ''}
                                onChange={e => hf('gradient', e.target.value)}
                                style={{ flex: 1, minWidth: '200px', padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}
                                placeholder="linear-gradient(135deg, #1a1040 0%, #312e81 50%, #1e3a5f 100%)"
                              />
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  const hue1 = Math.floor(Math.random() * 360);
                                  const hue2 = (hue1 + 40 + Math.floor(Math.random() * 60)) % 360;
                                  const hslToHex = (h, s, l) => {
                                    l /= 100;
                                    const a = s * Math.min(l, 1 - l) / 100;
                                    const f = n => {
                                      const k = (n + h / 30) % 12;
                                      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                                      return Math.round(255 * color).toString(16).padStart(2, '0');
                                    };
                                    return `#${f(0)}${f(8)}${f(4)}`;
                                  };
                                  hf('gradient', `linear-gradient(135deg, ${hslToHex(hue1, 80, 20)} 0%, ${hslToHex(hue2, 85, 30)} 100%)`);
                                }}
                                style={{ background: '#f3e8ff', color: '#7c3aed', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                              >
                                <FaLightbulb style={{ fontSize: '0.8rem' }} /> AI Suggest
                              </button>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                              {[
                                'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                                'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                                'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
                                'linear-gradient(135deg, #1a1040 0%, #1e3a5f 100%)',
                                'linear-gradient(135deg, #2d2a2e 0%, #1a191a 100%)',
                                'linear-gradient(135deg, #2e0249 0%, #a91079 100%)',
                                'linear-gradient(135deg, #093028 0%, #237A57 100%)'
                              ].map(grad => (
                                <div
                                  key={grad}
                                  onClick={() => hf('gradient', grad)}
                                  style={{ width: '36px', height: '36px', borderRadius: '8px', background: grad, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.1)' }}
                                >
                                  {project.gradient === grad && <FaCheck style={{ color: '#fff', fontSize: '0.8rem', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }} />}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {/* Accent A */}
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6366f1' }} />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Accent Color A (Primary)</span>
                              </div>
                              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Used for label badges, tag borders, button glow, and orb highlight.</p>

                              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1.2rem' }}>
                                <div style={{ flex: 1 }}>
                                  <PopoverColorPicker
                                    color={project.accent_a || '#697381'}
                                    onChange={c => hf('accent_a', c)}
                                    inputStyle={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}
                                    customSwatchStyle={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 1 }}
                                    customColorStyle={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                                  />
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const rHue = Math.floor(Math.random() * 360);
                                    const hslToHex = (h, s, l) => {
                                      l /= 100;
                                      const a = s * Math.min(l, 1 - l) / 100;
                                      const f = n => {
                                        const k = (n + h / 30) % 12;
                                        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                                        return Math.round(255 * color).toString(16).padStart(2, '0');
                                      };
                                      return `#${f(0)}${f(8)}${f(4)}`;
                                    };
                                    hf('accent_a', hslToHex(rHue, 85, 60));
                                  }}
                                  style={{ background: '#f3e8ff', color: '#7c3aed', border: 'none', padding: '0.7rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                                >
                                  <FaLightbulb style={{ fontSize: '0.8rem' }} /> AI Suggest
                                </button>
                              </div>

                              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                {['#6366f1', '#3b82f6', '#14b8a6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#697381'].map(color => (
                                  <div
                                    key={color}
                                    onClick={() => hf('accent_a', color)}
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    {(project.accent_a || '#697381') === color && <FaCheck style={{ color: '#fff', fontSize: '0.8rem' }} />}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Accent B */}
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.2rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#38bdf8' }} />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Accent Color B (Secondary)</span>
                              </div>
                              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Used for the second decorative orb colour on the card.</p>

                              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1.2rem' }}>
                                <div style={{ flex: 1 }}>
                                  <PopoverColorPicker
                                    color={project.accent_b || '#38bdf8'}
                                    onChange={c => hf('accent_b', c)}
                                    inputStyle={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}
                                    customSwatchStyle={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 1 }}
                                    customColorStyle={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                                  />
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const rHue = Math.floor(Math.random() * 360);
                                    const hslToHex = (h, s, l) => {
                                      l /= 100;
                                      const a = s * Math.min(l, 1 - l) / 100;
                                      const f = n => {
                                        const k = (n + h / 30) % 12;
                                        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                                        return Math.round(255 * color).toString(16).padStart(2, '0');
                                      };
                                      return `#${f(0)}${f(8)}${f(4)}`;
                                    };
                                    hf('accent_b', hslToHex(rHue, 85, 60));
                                  }}
                                  style={{ background: '#f3e8ff', color: '#7c3aed', border: 'none', padding: '0.7rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                                >
                                  <FaLightbulb style={{ fontSize: '0.8rem' }} /> AI Suggest
                                </button>
                              </div>

                              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                {['#6366f1', '#3b82f6', '#14b8a6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#697381'].map(color => (
                                  <div
                                    key={color}
                                    onClick={() => hf('accent_b', color)}
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    {(project.accent_b || '#38bdf8') === color && <FaCheck style={{ color: '#fff', fontSize: '0.8rem' }} />}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div style={{ marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                              <FaEye style={{ color: '#7c3aed', fontSize: '1.1rem' }} />
                              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Live Preview</span>
                            </div>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>See how your selected colors will look on the project card.</p>

                            {/* Preview Card */}
                            <div style={{
                              background: project.gradient || 'linear-gradient(135deg, #1a1040 0%, #312e81 50%, #1e3a5f 100%)',
                              borderRadius: '16px',
                              padding: '2.5rem 2rem',
                              position: 'relative',
                              overflow: 'hidden',
                              minHeight: '260px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                            }}>
                              {/* Orbs */}
                              <div style={{
                                position: 'absolute', top: '10%', right: '15%', width: '120px', height: '120px',
                                borderRadius: '50%', border: `1px solid ${project.accent_b || '#38bdf8'}`,
                                background: `radial-gradient(circle, ${project.accent_a || '#697381'}44 0%, transparent 70%)`
                              }} />
                              <div style={{
                                position: 'absolute', bottom: '-20%', right: '-5%', width: '250px', height: '250px',
                                borderRadius: '50%', border: `1px solid ${project.accent_a || '#697381'}44`
                              }} />

                              <div style={{ position: 'relative', zIndex: 1, maxWidth: '65%' }}>
                                <span style={{
                                  background: 'rgba(255,255,255,0.1)',
                                  color: '#e5e7eb',
                                  padding: '4px 12px',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem'
                                }}>
                                  Featured Project
                                </span>
                                <h2 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, margin: '1.2rem 0 0.8rem 0', fontFamily: 'sans-serif' }}>
                                  {project.title || 'Project Title'}
                                </h2>
                                <p style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
                                  {project.short_desc || 'This is a short description of the project that showcases how the colors look on the card.'}
                                </p>

                                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                                  {['React', 'Node.js', 'MongoDB'].map(tag => (
                                    <span key={tag} style={{
                                      border: `1px solid ${project.accent_a || '#697381'}`,
                                      color: '#e5e7eb',
                                      padding: '4px 14px',
                                      borderRadius: '16px',
                                      fontSize: '0.75rem',
                                      background: 'rgba(255,255,255,0.05)'
                                    }}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                  <button style={{
                                    background: 'transparent',
                                    color: '#fff',
                                    border: `1px solid ${project.accent_a || '#697381'}`,
                                    padding: '0.6rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                  }}>
                                    View Project <FaExternalLinkAlt style={{ fontSize: '0.7rem', marginLeft: '0.4rem' }} />
                                  </button>
                                  <button style={{
                                    background: project.accent_b || '#3b82f6',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.6rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                  }}>
                                    Live Demo
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 4 — Detail Page Content */}
                      <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {/* Header */}
                        <div style={{ background: '#4c2882', padding: '0.75rem 1.25rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.95rem' }}>
                            <FaCode /> Detail Page Content
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>Shown when visitor clicks "See More"</span>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                          {/* Overview Card */}
                          <div>
                            <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                              <h4 style={{ margin: '0 0 0.6rem 0', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>Overview</h4>
                              <textarea
                                value={project.overview || ''}
                                onChange={e => hf('overview', e.target.value)}
                                style={{
                                  width: '100%', height: '80px', border: '1.5px solid #c2a673', borderRadius: '6px',
                                  padding: '1rem', fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: '0.9rem',
                                  color: 'var(--text-primary)', resize: 'vertical', outline: 'none'
                                }}
                                placeholder="Describe what the project is, what it does, and who would use it. Aim for 3-5 sentences."
                              />
                            </div>
                            <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', marginLeft: '0.2rem' }}>Big intro paragraph at the top of the detail page</small>
                          </div>

                          {/* Grid for Problem & Solution */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                            {/* The Problem */}
                            <div>
                              <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                                <h4 style={{ margin: '0 0 0.6rem 0', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>The Problem</h4>
                                <textarea
                                  value={project.problem || ''}
                                  onChange={e => hf('problem', e.target.value)}
                                  style={{
                                    width: '100%', height: '80px', border: '1.5px solid #c2a673', borderRadius: '6px',
                                    padding: '1rem', fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: '0.9rem',
                                    color: 'var(--text-primary)', resize: 'vertical', outline: 'none'
                                  }}
                                  placeholder={"What pain point or challenge prompted this project?\nWhat was wrong before?"}
                                />
                              </div>
                              <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.4rem', marginLeft: '0.2rem' }}>Shown in a side-by-side block with "The Solution"</small>
                            </div>

                            {/* The Solution */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <div style={{ background: 'var(--bg-primary)', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                                <h4 style={{ margin: '0 0 0.6rem 0', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>The Solution</h4>
                                <textarea
                                  value={project.solution || ''}
                                  onChange={e => hf('solution', e.target.value)}
                                  style={{
                                    width: '100%', height: '80px', border: '1.5px solid #c2a673', borderRadius: '6px',
                                    padding: '1rem', fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: '0.9rem',
                                    color: 'var(--text-primary)', resize: 'vertical', outline: 'none'
                                  }}
                                  placeholder={"How did your project solve the problem? What approach\ndid you take?"}
                                />
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.4rem' }}>
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginLeft: '0.2rem' }}>Explains your approach and why it works</small>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const normalizeProject = (p) => ({ ...p, tech_stack_json: p.tech_stack_json, timeline_json: p.timeline_json, learnings_json: p.learnings_json });
                                    saveCollection('projects', projects, setProjects, '/projects', normalizeProject)();
                                  }}
                                  style={{
                                    background: '#6d28d9', color: '#ffffff', border: 'none', borderRadius: '6px',
                                    padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  Save Changes
                                </button>
                              </div>
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
                        <div style={{ padding: '1.5rem' }}>
                          {tsItems.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>No tech stack entries yet. Click "Add Technology" to explain each tool you used.</p>
                          )}
                          {tsItems.map((ts, ti) => (
                            <div key={ti} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '1rem', marginBottom: '0.8rem', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '0.8rem 1rem', border: '1px solid var(--border-color)' }}>
                              <input value={ts.name || ''} placeholder="Technology (e.g. Docker)" onChange={e => updateSubList('tech_stack_json', list => list.map((x, xi) => xi === ti ? { ...x, name: e.target.value } : x))} style={{ fontWeight: 600 }} />
                              <input value={ts.purpose || ''} placeholder="What you used it for (e.g. Containerising the Node.js app)" onChange={e => updateSubList('tech_stack_json', list => list.map((x, xi) => xi === ti ? { ...x, purpose: e.target.value } : x))} />
                              <button className="remove-button" style={{ padding: '4px 8px' }} title="Remove this technology" onClick={() => updateSubList('tech_stack_json', list => list.filter((_, xi) => xi !== ti))}><FaTrash /></button>
                            </div>
                          ))}
                          <button className="add-button-empty" style={{ marginTop: '0.6rem' }} onClick={() => updateSubList('tech_stack_json', list => [...list, { name: '', purpose: '' }])}>
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
                        <div style={{ padding: '1.5rem' }}>
                          {tlItems.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>No steps yet. Add the key phases of how you built this project.</p>
                          )}
                          {tlItems.map((tl, ti) => (
                            <div key={ti} style={{ display: 'grid', gridTemplateColumns: '55px 1fr 2fr auto', gap: '1rem', marginBottom: '0.8rem', alignItems: 'flex-start', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '0.8rem 1rem', border: '1px solid var(--border-color)' }}>
                              <input value={tl.step || ''} placeholder="01" title="Step number" onChange={e => updateSubList('timeline_json', list => list.map((x, xi) => xi === ti ? { ...x, step: e.target.value } : x))} style={{ textAlign: 'center', fontWeight: 700, padding: '0.6rem' }} />
                              <input value={tl.title || ''} placeholder="Step title (e.g. Write Dockerfile)" onChange={e => updateSubList('timeline_json', list => list.map((x, xi) => xi === ti ? { ...x, title: e.target.value } : x))} />
                              <textarea value={tl.desc || ''} placeholder="What you did in this step..." style={{ height: '52px' }} onChange={e => updateSubList('timeline_json', list => list.map((x, xi) => xi === ti ? { ...x, desc: e.target.value } : x))} />
                              <button className="remove-button" style={{ padding: '4px 8px', marginTop: '2px' }} title="Remove this step" onClick={() => updateSubList('timeline_json', list => list.filter((_, xi) => xi !== ti))}><FaTrash /></button>
                            </div>
                          ))}
                          <button className="add-button-empty" style={{ marginTop: '0.6rem' }} onClick={() => updateSubList('timeline_json', list => [...list, { step: String(list.length + 1).padStart(2, '0'), title: '', desc: '' }])}>
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
                        <div style={{ padding: '1.5rem' }}>
                          {lnItems.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>No learnings yet. Add what you learned or accomplished from this project.</p>
                          )}
                          {lnItems.map((ln, li) => (
                            <div key={li} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '0.8rem', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '0.6rem 1rem', border: '1px solid var(--border-color)' }}>
                              <input value={ln || ''} placeholder={`e.g. How to configure GitHub Actions secrets (entry ${li + 1})`} onChange={e => updateSubList('learnings_json', list => list.map((x, xi) => xi === li ? e.target.value : x))} />
                              <button className="remove-button" style={{ padding: '4px 8px' }} title="Remove this learning" onClick={() => updateSubList('learnings_json', list => list.filter((_, xi) => xi !== li))}><FaTrash /></button>
                            </div>
                          ))}
                          <button className="add-button-empty" style={{ marginTop: '0.6rem' }} onClick={() => updateSubList('learnings_json', list => [...list, ''])}>
                            <FaPlus /> Add Learning
                          </button>
                        </div>
                      </div>

                      {/* SECTION 8 — Screenshots / Images */}
                      <div style={{ border: '1px solid rgba(236,72,153,0.25)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(236,72,153,0.07)', padding: '0.55rem 1rem', fontWeight: 700, fontSize: '0.88rem', color: '#db2777', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaImage /> Project Screenshots ({imItems.length})
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>Shown in a vertical slider on detail page</span>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                          {imItems.length === 0 && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>No screenshots yet. Add image URLs to show off your project.</p>
                          )}
                          {imItems.map((imgUrl, li) => (
                            <div key={li} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '0.8rem', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '0.6rem 1rem', border: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', gap: '0.6rem', flex: 1 }}>
                                <input value={imgUrl || ''} placeholder={`URL or upload a local file (Image ${li + 1})`} onChange={e => updateSubList('images_json', list => list.map((x, xi) => xi === li ? e.target.value : x))} style={{ flex: 1 }} />
                                <label className="home-image-btn" style={{ padding: '0.85rem 1.2rem', cursor: 'pointer', margin: 0 }}>
                                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(e, (url) => updateSubList('images_json', list => list.map((x, xi) => xi === li ? url : x)))} />
                                  Browse...
                                </label>
                              </div>
                              <button className="remove-button" style={{ padding: '4px 8px' }} title="Remove this image" onClick={() => updateSubList('images_json', list => list.filter((_, xi) => xi !== li))}><FaTrash /></button>
                            </div>
                          ))}
                          <button className="add-button-empty" style={{ marginTop: '0.6rem' }} onClick={() => updateSubList('images_json', list => [...list, ''])}>
                            <FaPlus /> Add Image URL
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
              <button
                onClick={() => {
                  setProjects(prev => [...prev, { ...newItem.projects, id: `new-${Date.now()}` }]);
                  const newKey = `new-${projects.length}`;
                  setCollapsedProjects(prev => ({ ...prev, [newKey]: false }));
                }}
                style={{
                  background: '#ecfdf5', color: '#059669', border: '1.5px dashed #34d399',
                  padding: '0 1.5rem', borderRadius: '8px', fontWeight: 600,
                  fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  height: '48px', transition: 'all 0.2s'
                }}
              >
                <FaPlus /> Add New Project
              </button>

              <button
                onClick={saveCollection('projects', projects, setProjects, '/projects', (p) => ({
                  ...p,
                  tech_stack_json: p.tech_stack_json || [],
                  timeline_json: p.timeline_json || [],
                  learnings_json: p.learnings_json || [],
                  images_json: p.images_json || [],
                  show_github: p.show_github !== undefined ? p.show_github : true,
                  show_demo: p.show_demo !== undefined ? p.show_demo : true,
                  show_details: p.show_details !== undefined ? p.show_details : true
                }))}
                disabled={loading.projects}
                style={{
                  background: 'linear-gradient(90deg, #14b8a6 0%, #3b82f6 50%, #8b5cf6 100%)', // matching the vivid blue/purple gradient
                  color: '#ffffff', border: 'none',
                  padding: '0 2.5rem', borderRadius: '8px', fontWeight: 600,
                  fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                  height: '48px', minWidth: '240px', justifyContent: 'center',
                  backgroundSize: '200% auto', animation: 'gradient 3s ease infinite'
                }}
              >
                <FaSave style={{ fontSize: '1rem' }} /> {loading.projects ? 'Saving...' : 'Save All Projects'}
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
            <button className="save-button" onClick={saveCollection('experiences', experiences, setExperiences, '/experiences', normalizeExperience)} disabled={loading.experiences}>
              <FaSave /> {loading.experiences ? 'Saving...' : 'Save Experience'}
            </button>
          </section>
        )}

        {activeTab === 'Education' && (
          <section className="admin-section">
            {status.education && <p className={`status-message ${status.education.type}`}>{status.education.text}</p>}

            {education.map((edu, i) => (
              <div key={edu.id || i} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

                  {/* Degree */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Degree</label>
                    <input value={edu.degree || ''} placeholder="e.g. Bachelor of Technology in Computer Science Engineering" onChange={(e) => handleListField(setEducation, i, 'degree', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>

                  {/* Institution */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Institution</label>
                    <input value={edu.institution || ''} placeholder="e.g. XXXXX University" onChange={(e) => handleListField(setEducation, i, 'institution', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>

                  {/* Location & GPA */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Location</label>
                      <input value={edu.location || ''} placeholder="e.g. India" onChange={(e) => handleListField(setEducation, i, 'location', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>GPA</label>
                      <input value={edu.gpa || ''} placeholder="e.g. 8.50" onChange={(e) => handleListField(setEducation, i, 'gpa', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>

                  {/* Dates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Start date</label>
                      <input type="date" value={edu.start_date ? edu.start_date.split('T')[0] : ''} onChange={(e) => handleListField(setEducation, i, 'start_date', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>End date</label>
                      <input type="date" value={edu.end_date ? edu.end_date.split('T')[0] : ''} onChange={(e) => handleListField(setEducation, i, 'end_date', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>

                  {/* Current Study Toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginTop: '0.2rem', width: 'fit-content' }}>
                    <div style={{
                      position: 'relative', width: '36px', height: '20px',
                      backgroundColor: edu.current ? '#3b82f6' : '#d1d5db',
                      borderRadius: '20px', transition: 'background-color 0.2s'
                    }}>
                      <div style={{
                        position: 'absolute', top: '2px', left: edu.current ? '18px' : '2px',
                        width: '16px', height: '16px', backgroundColor: '#fff',
                        borderRadius: '50%', transition: 'left 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }} />
                    </div>
                    <input
                      type="checkbox"
                      checked={!!edu.current}
                      onChange={(e) => handleListField(setEducation, i, 'current', e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>Current study</span>
                  </label>

                  {/* Description */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Description</label>
                    <textarea value={edu.description || ''} onChange={(e) => handleListField(setEducation, i, 'description', e.target.value)} style={{ width: '100%', minHeight: '90px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }} />
                  </div>

                  {/* Remove Button for this entry */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => removeListItem('education', education, setEducation, i, '/education')}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <FaTrash /> Remove Entry
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
              <button
                onClick={() => addListItem(setEducation, 'education')}
                style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FaPlus /> Add education
              </button>

              <button
                onClick={saveCollection('education', education, setEducation, '/education', normalizeEducation)}
                disabled={loading.education}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FaSave /> {loading.education ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
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
