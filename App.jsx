import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GraduationCap, MapPin, BookOpen, Megaphone, UserRound, LogIn, LogOut,
  Globe, Search, Download, FileText, FlaskConical, Calculator, Atom,
  Monitor, Languages, Dumbbell, Clock3, ShieldCheck, Plus, Menu, X,
  LayoutDashboard, LibraryBig, AlertCircle, CheckCircle2, UploadCloud, Moon, Sun, CalendarDays, ClipboardCheck, Users, BookMarked, GraduationCap as CapIcon
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { translations, getSpecialties } from './i18n.js';

const SPECIALTIES = [
  'علوم الطبيعة والحياة', 'الرياضيات', 'الفيزياء', 'الإعلام الآلي',
  'اللغة العربية', 'اللغة الفرنسية', 'اللغة الإنجليزية',
  'التاريخ والجغرافيا', 'التربية البدنية'
];


const CURRICULUM = {
 ar: {
  'أستاذ التعليم الابتدائي': ['اللغة العربية','الرياضيات','التربية الإسلامية','التربية العلمية والتكنولوجية','التاريخ والجغرافيا','التربية المدنية','التربية الفنية','التربية البدنية','اللغة الإنجليزية (ابتداءً من السنة الثالثة)','اللغة الفرنسية (ابتداءً من السنة الرابعة)'],
  'أستاذ التعليم المتوسط': ['اللغة العربية','الرياضيات','علوم الطبيعة والحياة','العلوم الفيزيائية والتكنولوجيا','اللغة الإنجليزية','اللغة الفرنسية','التاريخ والجغرافيا','التربية الإسلامية','التربية المدنية','الإعلام الآلي','التربية البدنية','الفنون التشكيلية / الموسيقى'],
  'علوم الطبيعة والحياة': ['علم الخلية','الوراثة','علم البيئة','التنوع الحيوي','التشريح والفيزيولوجيا','الجيولوجيا','المناعة','البيولوجيا الجزيئية'],
  'الرياضيات': ['التحليل','الجبر','الهندسة','الاحتمالات والإحصاء','الرياضيات المتقطعة','ديداكتيك الرياضيات'],
  'الفيزياء': ['الميكانيك','الكهرباء والمغناطيسية','البصريات','الترموديناميك','الفيزياء الحديثة','القياس والتجريب'],
  'الإعلام الآلي': ['الخوارزميات','البرمجة','قواعد البيانات','الشبكات','أنظمة التشغيل','أمن المعلومات'],
  'اللغات والعلوم الإنسانية': ['قواعد اللغة','اللسانيات','الأدب والنصوص','التعبير الشفهي والكتابي','الحضارة والثقافة','التاريخ والجغرافيا','طرائق التدريس']
 },
 fr: {
  'Enseignement primaire': ['Arabe','Mathématiques','Éducation islamique','Sciences et technologie','Histoire-géographie','Éducation civique','Éducation artistique','Éducation physique','Anglais dès la 3e année','Français dès la 4e année'],
  'Enseignement moyen': ['Arabe','Mathématiques','Sciences naturelles','Sciences physiques et technologie','Anglais','Français','Histoire-géographie','Éducation islamique','Éducation civique','Informatique','Éducation physique','Arts'],
  'Sciences naturelles': ['Biologie cellulaire','Génétique','Écologie','Biodiversité','Anatomie et physiologie','Géologie','Immunologie','Biologie moléculaire'],
  'Mathématiques': ['Analyse','Algèbre','Géométrie','Probabilités et statistiques','Mathématiques discrètes','Didactique'],
  'Physique': ['Mécanique','Électricité et magnétisme','Optique','Thermodynamique','Physique moderne','Mesures expérimentales'],
  'Informatique': ['Algorithmique','Programmation','Bases de données','Réseaux','Systèmes d’exploitation','Sécurité informatique'],
  'Langues et sciences humaines': ['Grammaire','Linguistique','Littérature','Expression orale et écrite','Civilisation','Histoire-géographie','Didactique']
 },
 en: {
  'Primary education': ['Arabic','Mathematics','Islamic education','Science and technology','History and geography','Civic education','Arts','Physical education','English from Grade 3','French from Grade 4'],
  'Middle education': ['Arabic','Mathematics','Natural sciences','Physical sciences and technology','English','French','History and geography','Islamic education','Civic education','Computer science','Physical education','Arts'],
  'Natural sciences': ['Cell biology','Genetics','Ecology','Biodiversity','Anatomy and physiology','Geology','Immunology','Molecular biology'],
  'Mathematics': ['Analysis','Algebra','Geometry','Probability and statistics','Discrete mathematics','Mathematics education'],
  'Physics': ['Mechanics','Electricity and magnetism','Optics','Thermodynamics','Modern physics','Experimental measurement'],
  'Computer science': ['Algorithms','Programming','Databases','Networks','Operating systems','Information security'],
  'Languages and humanities': ['Grammar','Linguistics','Literature','Oral and written expression','Culture','History and geography','Teaching methods']
 }
};

const TIMETABLES = [
  { id:'english_middle_year2', title:'أستاذ الإنجليزية', specialty:'اللغة الإنجليزية', level:'أستاذ التعليم المتوسط', year:'السنة الثانية', file:'/timetables/english_middle_year2.jpg' },
  { id:'french_primary_middle_year2', title:'أستاذ الفرنسية', specialty:'اللغة الفرنسية', level:'ابتدائي + متوسط', year:'السنة الثانية', file:'/timetables/french_primary_middle_year2.jpg' },
  { id:'natural_sciences_middle_year2', title:'أستاذ العلوم الطبيعية', specialty:'علوم الطبيعة والحياة', level:'أستاذ التعليم المتوسط', year:'السنة الثانية', file:'/timetables/natural_sciences_middle_year2.jpg' },
  { id:'arabic_middle_year2', title:'أستاذ اللغة العربية', specialty:'اللغة العربية', level:'أستاذ التعليم المتوسط', year:'السنة الثانية', file:'/timetables/arabic_middle_year2.jpg' },
  { id:'computer_science_middle_year2', title:'أستاذ الإعلام الآلي', specialty:'الإعلام الآلي', level:'أستاذ التعليم المتوسط', year:'السنة الثانية', file:'/timetables/computer_science_middle_year2.jpg' },
  { id:'history_geography_middle_year2', title:'أستاذ التاريخ والجغرافيا', specialty:'التاريخ والجغرافيا', level:'أستاذ التعليم المتوسط', year:'السنة الثانية', file:'/timetables/history_geography_middle_year2.jpg' },
  { id:'arabic_primary_year2', title:'أستاذ اللغة العربية', specialty:'اللغة العربية', level:'أستاذ التعليم الابتدائي', year:'السنة الثانية', file:'/timetables/arabic_primary_year2.jpg' },
  { id:'physical_education_year2', title:'أستاذ التربية البدنية', specialty:'التربية البدنية', level:'متوسط + ثانوي', year:'السنة الثانية', file:'/timetables/physical_education_year2.jpg' },
  { id:'english_middle_year1', title:'أستاذ الإنجليزية', specialty:'اللغة الإنجليزية', level:'أستاذ التعليم المتوسط', year:'السنة الأولى', file:'/timetables/english_middle_year1.jpg' },
  { id:'natural_sciences_middle_year1', title:'أستاذ العلوم الطبيعية', specialty:'علوم الطبيعة والحياة', level:'أستاذ التعليم المتوسط', year:'السنة الأولى', file:'/timetables/natural_sciences_middle_year1.jpg' },
];

const resourceTypeKeys = {
  lesson: 'resourceTypeLesson', summary: 'resourceTypeSummary',
  exam: 'resourceTypeExam', other: 'resourceTypeOther'
};

function App() {
  const [lang, setLang] = useState(localStorage.getItem('ens-lang') || 'ar');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('ens-theme') === 'dark');
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [roster, setRoster] = useState([]);
  const [attendanceForm, setAttendanceForm] = useState({ title: '', specialty: SPECIALTIES[0], class_name: '', session_date: new Date().toISOString().slice(0,10) });
  const [attendanceMarks, setAttendanceMarks] = useState({});
  const [lessonView, setLessonView] = useState(null);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const t = translations[lang] || translations.ar;
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [active, setActive] = useState('home');
  const [mobileNav, setMobileNav] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [resources, setResources] = useState([]);
  const [query, setQuery] = useState('');
  const [timetableSpecialty, setTimetableSpecialty] = useState('all');
  const [timetableYear, setTimetableYear] = useState('all');
  const [timetableLevel, setTimetableLevel] = useState('all');
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', specialty: SPECIALTIES[0], subject: '', kind: 'lesson' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '' });
  const [authForm, setAuthForm] = useState({ email: '', password: '', full_name: '', specialty: SPECIALTIES[0], student_number: '' });

  const role = profile?.role || 'student';
  const isTeacher = role === 'teacher' || role === 'admin';
  const isAdmin = role === 'admin';
  const isRtl = lang === 'ar';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    localStorage.setItem('ens-lang', lang);
  }, [lang, isRtl]);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('ens-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const showNotice = useCallback((kind, message) => {
    setNotice({ kind, message });
    window.setTimeout(() => setNotice(null), 5500);
  }, []);

  const loadPublicData = useCallback(async () => {
    if (!supabase) return;
    const [a, r] = await Promise.all([
      supabase.from('announcements').select('id,title,body,created_at,author_id').eq('published', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('resources').select('id,title,description,content,specialty,subject,kind,file_path,created_at,author_id').eq('published', true).order('created_at', { ascending: false }).limit(100)
    ]);
    if (!a.error) setAnnouncements(a.data || []);
    if (!r.error) setResources(r.data || []);
  }, []);

  const loadAttendance = useCallback(async (user, currentProfile) => {
    if (!supabase || !user || !currentProfile) return;
    if (currentProfile.role === 'student') {
      const { data, error } = await supabase.from('attendance_records')
        .select('id,status,session_date,session_title,class_name,specialty')
        .eq('student_id', user.id).order('session_date', { ascending: false });
      if (!error) setAttendanceSessions(data || []); else console.error(error.message);
    } else if (['teacher','admin'].includes(currentProfile.role)) {
      const { data, error } = await supabase.from('profiles')
        .select('id,full_name,email,student_number,specialty').eq('role','student')
        .eq('specialty', currentProfile.specialty || SPECIALTIES[0]).order('full_name');
      if (!error) setRoster(data || []); else console.error(error.message);
      const { data: sessions } = await supabase.from('attendance_sessions')
        .select('id,title,specialty,class_name,session_date,created_at')
        .eq('teacher_id', user.id).order('session_date',{ascending:false}).limit(40);
      setAttendanceSessions(sessions || []);
    }
  }, []);

  const loadProfile = useCallback(async (user) => {
    if (!supabase || !user) { setProfile(null); return; }
    const { data, error } = await supabase.from('profiles')
      .select('id,full_name,email,role,specialty,student_number,created_at')
      .eq('id', user.id).maybeSingle();
    if (error) console.error('Profile load error:', error.message);
    setProfile(data || null);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) { await loadProfile(data.session.user); const {data: p} = await supabase.from('profiles').select('id,full_name,email,role,specialty,student_number,created_at').eq('id',data.session.user.id).maybeSingle(); await loadAttendance(data.session.user,p); }
      await loadPublicData();
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setTimeout(() => loadProfile(newSession.user), 0);
      } else setProfile(null);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [loadProfile, loadPublicData, loadAttendance]);

  useEffect(() => {
    if (supabase) loadPublicData();
  }, [supabase, loadPublicData]);

  useEffect(() => {
    if (isTeacher && profile?.specialty && !attendanceForm.title && attendanceForm.specialty !== profile.specialty) {
      setAttendanceForm(prev => ({...prev, specialty: profile.specialty}));
    }
  }, [isTeacher, profile?.specialty]);

  useEffect(() => {
    if (!supabase || !session?.user || !isTeacher || !attendanceForm.specialty) return;
    supabase.from('profiles').select('id,full_name,email,student_number,specialty').eq('role','student').eq('specialty',attendanceForm.specialty).order('full_name').then(({data,error}) => { if (!error) setRoster(data || []); });
  }, [session?.user?.id, isTeacher, attendanceForm.specialty]);

  const changeTab = (tab) => { setActive(tab); setMobileNav(false); };
  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null); setProfile(null); setActive('home');
    showNotice('success', t.success);
  };

  const submitAuth = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    if (authForm.password.length < 10) {
      showNotice('error', t.passwordMin); return;
    }
    setBusy(true);
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email.trim(),
          password: authForm.password,
          options: {
            data: {
              full_name: authForm.full_name.trim(),
              specialty: authForm.specialty,
              student_number: authForm.student_number.trim() || null
            }
          }
        });
        if (error) throw error;
        if (data.session) await loadProfile(data.user);
        showNotice('success', t.accountPending);
        setAuthMode('login');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email.trim(), password: authForm.password
        });
        if (error) throw error;
        await loadProfile(data.user);
        const { data: p } = await supabase.from('profiles').select('id,full_name,email,role,specialty,student_number,created_at').eq('id',data.user.id).maybeSingle();
        await loadAttendance(data.user,p);
        showNotice('success', t.success);
        setActive('portal');
      }
    } catch (err) {
      showNotice('error', err.message || t.error);
    } finally { setBusy(false); }
  };

  const publishResource = async (e) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    if (!supabase || !session?.user || !isTeacher) { showNotice('error', t.teacherOnly); return; }
    const fileInput = formElement.querySelector('input[type="file"]');
    const file = fileInput?.files?.[0];
    if (!resourceForm.description.trim() && !file) { showNotice('error', lang === 'ar' ? 'اكتب محتوى الدرس أو أرفق ملفًا.' : 'Enter lesson content or attach a file.'); return; }
    if (file && file.size > 20 * 1024 * 1024) { showNotice('error', 'حجم الملف الأقصى 20 ميغابايت / Max file size: 20 MB'); return; }
    if (file && !['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) { showNotice('error','الملفات المسموحة PDF أو Word فقط'); return; }
    setBusy(true);
    try {
      let path = null;
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        path = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('learning-resources').upload(path,file,{contentType:file.type,upsert:false});
        if (uploadError) throw uploadError;
      }
      const { error } = await supabase.from('resources').insert({
        title: resourceForm.title.trim(), description: resourceForm.description.trim() || null,
        content: resourceForm.description.trim() || null, specialty: resourceForm.specialty,
        subject: resourceForm.subject.trim() || null, kind: resourceForm.kind, file_path: path,
        author_id: session.user.id, published: true
      });
      if (error) { if(path) await supabase.storage.from('learning-resources').remove([path]); throw error; }
      setResourceForm({ title:'',description:'',specialty:SPECIALTIES[0],subject:'',kind:'lesson' }); formElement.reset();
      await loadPublicData(); showNotice('success', t.success);
    } catch (err) { showNotice('error', err.message || t.error); }
    finally { setBusy(false); }
  };

  const publishAnnouncement = async (e) => {
    e.preventDefault();
    if (!supabase || !isAdmin) { showNotice('error', t.adminOnly); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from('announcements').insert({
        title: announcementForm.title.trim(),
        body: announcementForm.body.trim(),
        author_id: session.user.id,
        published: true
      });
      if (error) throw error;
      setAnnouncementForm({ title: '', body: '' });
      await loadPublicData();
      showNotice('success', t.success);
    } catch (err) { showNotice('error', err.message || t.error); }
    finally { setBusy(false); }
  };

  const saveAttendance = async (e) => {
    e.preventDefault();
    if (!supabase || !session?.user || !isTeacher) return;
    if (!roster.length) { showNotice('error', lang === 'ar' ? 'لا يوجد طلبة في هذا التخصص. تحقق من التخصص المسجل في ملفات الطلبة.' : 'No students found for this specialty.'); return; }
    setAttendanceBusy(true);
    try {
      const payload = { teacher_id: session.user.id, title: attendanceForm.title.trim(), specialty: attendanceForm.specialty,
        class_name: attendanceForm.class_name.trim() || null, session_date: attendanceForm.session_date };
      const { data: sessionRow, error: sessionError } = await supabase.from('attendance_sessions').insert(payload).select('id').single();
      if (sessionError) throw sessionError;
      const rows = roster.map(student => ({ session_id: sessionRow.id, student_id: student.id, session_date: attendanceForm.session_date, session_title: attendanceForm.title.trim(), class_name: attendanceForm.class_name.trim() || null, specialty: attendanceForm.specialty,
        status: attendanceMarks[student.id] === 'absent' ? 'absent' : attendanceMarks[student.id] === 'late' ? 'late' : 'present' }));
      const { error } = await supabase.from('attendance_records').insert(rows);
      if (error) throw error;
      const absentCount = rows.filter(r => r.status === 'absent').length;
      const presentCount = rows.filter(r => r.status === 'present').length;
      setAttendanceMarks({}); setAttendanceForm({...attendanceForm,title:''});
      await loadAttendance(session.user, profile);
      showNotice('success', lang === 'ar' ? `تم حفظ الحصة: ${absentCount} غائب، ${presentCount} حاضر.` : `Session saved: ${absentCount} absent, ${presentCount} present.`);
    } catch (err) { showNotice('error', err.message || t.error); }
    finally { setAttendanceBusy(false); }
  };

  const deleteAnnouncement = async (id) => {
    if (!isAdmin || !window.confirm(t.confirmDelete)) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) showNotice('error', error.message);
    else { await loadPublicData(); showNotice('success', t.success); }
  };

  const openResource = async (resource) => {
    if (resource.content || resource.description) { setLessonView(resource); return; }
    if (!supabase || !resource.file_path) { showNotice('error', t.error); return; }
    const { data, error } = await supabase.storage.from('learning-resources').createSignedUrl(resource.file_path, 120);
    if (error) { showNotice('error', error.message); return; }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const filteredResources = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return resources;
    return resources.filter(r => [r.title, r.description, r.specialty, r.subject, r.kind]
      .some(value => String(value || '').toLocaleLowerCase().includes(q)));
  }, [resources, query]);

  const navItems = [
    ['home', t.home, GraduationCap],
    ['library', t.library, LibraryBig],
    ['timetables', lang === 'fr' ? 'Emplois du temps' : lang === 'en' ? 'Timetables' : 'جداول التوقيت', CalendarDays],
    ['specialties', t.specialties, FlaskConical],
    ['announcements', t.announcements, Megaphone],
    ['portal', t.portal, LayoutDashboard]
  ];

  const specialtyGroups = getSpecialties(t);

  if (!isSupabaseConfigured) {
    return <div className="config-screen" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="config-card">
        <div className="brand-logo large"><GraduationCap size={34} /></div>
        <h1>{t.configTitle}</h1><p>{t.configDesc}</p><p className="muted">{t.configStep}</p>
        <LanguageSelect lang={lang} setLang={setLang} t={t} />
      </div>
    </div>;
  }

  return <div className="app-shell">
    <header className="top-bar">
      <div className="brand-container">
        <div className="brand-logo"><GraduationCap size={25} /></div>
        <div className="brand-title"><h1>{t.brand}</h1><p>{t.tagline}</p></div>
      </div>
      <div className="header-actions">
        <span className="location-chip"><MapPin size={15} />{t.location}</span>
        <button className="icon-button theme-toggle" onClick={() => setDarkMode(v => !v)} aria-label={lang === 'ar' ? 'تبديل الوضع الليلي' : 'Toggle dark mode'} title={lang === 'ar' ? 'الوضع الليلي' : 'Dark mode'}>{darkMode ? <Sun size={18}/> : <Moon size={18}/>}</button>
        <LanguageSelect lang={lang} setLang={setLang} t={t} />
        <button className="icon-button mobile-menu" onClick={() => setMobileNav(v => !v)} aria-label="Menu">
          {mobileNav ? <X /> : <Menu />}
        </button>
      </div>
    </header>

    <nav className={`nav-tabs ${mobileNav ? 'nav-open' : ''}`}>
      {navItems.map(([id, label, Icon]) => <button key={id}
        className={`tab-btn ${active === id ? 'active' : ''}`} onClick={() => changeTab(id)}>
        <Icon size={17} />{label}
      </button>)}
      <div className="nav-spacer" />
      {session ? <button className="tab-btn signout-btn" onClick={signOut}><LogOut size={17} />{t.logout}</button>
        : <button className="tab-btn login-nav" onClick={() => { setActive('portal'); setAuthMode('login'); }}><LogIn size={17} />{t.login}</button>}
    </nav>

    {notice && <div className={`toast ${notice.kind}`} role="status">
      {notice.kind === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}{notice.message}
      <button onClick={() => setNotice(null)} aria-label="Close"><X size={16} /></button>
    </div>}

    <main className="main-container">
      {active === 'timetables' && <section className="page-section">
        <div className="section-heading"><div><span className="eyebrow">2026 / 2027</span><h2>{lang === 'fr' ? 'Emplois du temps' : lang === 'en' ? 'Class timetables' : 'جداول التوقيت حسب التخصص والسنة'}</h2><p className="muted">{lang === 'fr' ? 'Choisissez la spécialité, le niveau et l’année.' : lang === 'en' ? 'Filter by specialty, teaching level, and year.' : 'اختر التخصص والمستوى والسنة لعرض الجدول المناسب.'}</p></div></div>
        <div className="timetable-filters card">
          <label>{lang === 'fr' ? 'Spécialité' : lang === 'en' ? 'Specialty' : 'التخصص'}<select value={timetableSpecialty} onChange={e=>setTimetableSpecialty(e.target.value)}><option value="all">{lang === 'fr' ? 'Toutes les spécialités' : lang === 'en' ? 'All specialties' : 'كل التخصصات'}</option>{[...new Set(TIMETABLES.map(x=>x.specialty))].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
          <label>{lang === 'fr' ? 'Niveau' : lang === 'en' ? 'Teaching level' : 'المستوى'}<select value={timetableLevel} onChange={e=>setTimetableLevel(e.target.value)}><option value="all">{lang === 'fr' ? 'Tous les niveaux' : lang === 'en' ? 'All levels' : 'كل المستويات'}</option>{[...new Set(TIMETABLES.map(x=>x.level))].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
          <label>{lang === 'fr' ? 'Année' : lang === 'en' ? 'Year' : 'السنة'}<select value={timetableYear} onChange={e=>setTimetableYear(e.target.value)}><option value="all">{lang === 'fr' ? 'Toutes les années' : lang === 'en' ? 'All years' : 'كل السنوات'}</option>{[...new Set(TIMETABLES.map(x=>x.year))].map(x=><option key={x} value={x}>{x}</option>)}</select></label>
        </div>
        <div className="timetable-grid">{TIMETABLES.filter(x=>(timetableSpecialty==='all'||x.specialty===timetableSpecialty)&&(timetableYear==='all'||x.year===timetableYear)&&(timetableLevel==='all'||x.level===timetableLevel)).map(item=><article className="timetable-card" key={item.id}><div className="timetable-card-heading"><div><h3>{item.title}</h3><p>{item.level} · {item.year}</p></div><a href={item.file} download className="btn-secondary timetable-download"><Download size={16}/>{lang==='fr'?'Télécharger':lang==='en'?'Download':'تحميل'}</a></div><a href={item.file} target="_blank" rel="noreferrer" className="timetable-image-link" aria-label={lang==='ar'?'فتح الجدول بحجم كامل':'Open full timetable'}><img src={item.file} alt={`جدول توقيت ${item.title} - ${item.level} - ${item.year}`} loading="lazy" /></a></article>)}</div>
        {TIMETABLES.filter(x=>(timetableSpecialty==='all'||x.specialty===timetableSpecialty)&&(timetableYear==='all'||x.year===timetableYear)&&(timetableLevel==='all'||x.level===timetableLevel)).length===0 && <div className="card">لا يوجد جدول مطابق للفلاتر المختارة.</div>}
        <p className="muted timetable-note">ملاحظة: الجداول معروضة كما وردت في الصور المرسلة للسنة الجامعية 2026–2027. يمكن فتح الصورة أو تحميلها لقراءتها بدقة.</p>
      </section>}

      {active === 'home' && <section className="page-section">
        <div className="hero">
          <div className="hero-pattern" />
          <div className="hero-copy">
            <span className="eyebrow"><GraduationCap size={16} /> {t.brand}</span>
            <h2>{t.welcome}</h2><p>{t.intro}</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => changeTab('library')}><BookOpen size={18} />{t.explore}</button>
              <button className="btn-outline" onClick={() => changeTab('specialties')}>{t.learnMore}</button>
            </div>
          </div>
          <div className="hero-emblem"><GraduationCap size={78} strokeWidth={1.25} /><span>ENS<br/>DJELFA</span></div>
        </div>

        <div className="feature-grid">
          <Feature icon={<BookOpen />} title={t.resources} desc={t.resourcesDesc} onClick={() => changeTab('library')} />
          <Feature icon={<UserRound />} title={t.studentSpace} desc={t.studentDesc} onClick={() => changeTab('portal')} />
          <Feature icon={<UploadCloud />} title={t.teacherSpace} desc={t.teacherDesc} onClick={() => changeTab('portal')} />
          <Feature icon={<ShieldCheck />} title={t.adminSpace} desc={t.adminDesc} onClick={() => changeTab('portal')} />
        </div>

        <section className="card">
          <SectionTitle icon={<Megaphone />} title={t.latest} />
          {announcements.length ? <div className="announcement-list">
            {announcements.slice(0, 4).map(a => <Announcement key={a.id} item={a} t={t} />)}
          </div> : <EmptyState icon={<Megaphone />} text={t.noAnnouncements} />}
        </section>
      </section>}

      {active === 'library' && <section className="page-section">
        <div className="section-heading"><div><span className="eyebrow">{t.resources}</span><h2>{t.library}</h2></div>
          <div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search}/></div>
        </div>
        {filteredResources.length ? <div className="resource-grid">
          {filteredResources.map(r => <article className="resource-card" key={r.id}>
            <div className="resource-icon"><FileText size={26}/></div>
            <span className="resource-tag">{t[resourceTypeKeys[r.kind]] || r.kind}</span>
            <h3>{r.title}</h3>
            <p className="resource-description">{(r.content || r.description || r.subject || r.specialty).slice(0,180)}</p>
            <div className="resource-meta"><span>{r.specialty}</span>{r.subject && <span>{r.subject}</span>}</div>
            <button className="btn-secondary full-width" onClick={() => openResource(r)}>{r.file_path ? <Download size={16}/> : <BookOpen size={16}/>}{r.file_path ? t.download : (lang === 'ar' ? 'مطالعة الدرس' : lang === 'fr' ? 'Lire le cours' : 'Read lesson')}</button>
          </article>)}
        </div> : <EmptyState icon={<LibraryBig />} text={t.emptyResources} />}
      </section>}

      {active === 'specialties' && <section className="page-section">
        <div className="section-heading"><div><span className="eyebrow">{t.brand}</span><h2>{t.allSpecialties}</h2></div></div>
        <div className="specialty-groups">
          {specialtyGroups.map((group, i) => <article className="card specialty-group" key={i}>
            <h3>{group.group}</h3><div className="specialty-list">
              {group.items.map((item, j) => <div className="specialty-item" key={`${item}-${j}`}>
                <span className="specialty-icon">{iconForSpecialty(item, t)}</span><span>{item}</span>
              </div>)}
            </div>
          </article>)}
        </div>
        <section className="card curriculum-card"><SectionTitle icon={<BookMarked/>} title={lang==='ar'?'مواد التكوين حسب الأطوار والتخصصات':lang==='fr'?'Matières par cycle et spécialité':'Subjects by teaching cycle and specialty'}/><p className="muted">{lang==='ar'?'القوائم أدناه خطوط عامة لمواد التعليم المدرسي التي يُكوَّن الأستاذ لتدريسها، وليست قائمة رسمية بمقاييس التكوين الجامعي. تُراجع حسب المناشير والبرامج الرسمية للسنة الدراسية.':'Indicative school subjects for teacher preparation; not an official university module list. Verify against current ministry circulars.'}</p><div className="curriculum-grid">{Object.entries(CURRICULUM[lang] || CURRICULUM.ar).map(([key,items])=><article key={key}><h3>{key}</h3><p>{items.join(' · ')}</p></article>)}</div><p className="small-note">{lang==='ar'?'مرجع التحديث: وزارة التربية الوطنية، ترتيبات الدخول المدرسي 2026–2027.':'Update reference: Ministry of National Education, 2026–2027 school arrangements.'} <a href="https://www.education.gov.dz/2026/07/30/وزير-التربية-الوطنية-ينشّط-ندوة-صحفية-يقدّم-فيها-توضيحات-حول-الترتيبات-البيداغوجية-الجديدة-الخاصة-بالدخول-المدرسي/" target="_blank" rel="noreferrer">{lang==='ar'?'المصدر الرسمي':'Official source'}</a></p></section>
      </section>}

      {active === 'announcements' && <section className="page-section">
        <div className="section-heading"><div><span className="eyebrow">{t.brand}</span><h2>{t.announcements}</h2></div></div>
        {announcements.length ? <div className="announcement-list">{announcements.map(a =>
          <div className="announcement-row" key={a.id}><Announcement item={a} t={t}/>
            {isAdmin && <button className="btn-danger" onClick={() => deleteAnnouncement(a.id)}>{t.delete}</button>}
          </div>)}</div> : <EmptyState icon={<Megaphone />} text={t.noAnnouncements} />}
      </section>}

      {active === 'portal' && <section className="page-section">
        {!session ? <div className="auth-layout">
          <div className="auth-intro">
            <div className="brand-logo large"><GraduationCap size={34}/></div>
            <h2>{t.portal}</h2><p>{t.intro}</p>
            <div className="auth-note"><ShieldCheck size={19}/><span>{t.pendingRole}</span></div>
          </div>
          <form className="card auth-card" onSubmit={submitAuth}>
            <div className="auth-switch">
              <button type="button" className={authMode === 'login' ? 'selected' : ''} onClick={() => setAuthMode('login')}>{t.signIn}</button>
              <button type="button" className={authMode === 'signup' ? 'selected' : ''} onClick={() => setAuthMode('signup')}>{t.signUp}</button>
            </div>
            {authMode === 'signup' && <>
              <label>{t.fullName}<input required value={authForm.full_name} onChange={e => setAuthForm({...authForm, full_name:e.target.value})} autoComplete="name"/></label>
              <label>{t.chooseSpecialty}<select value={authForm.specialty} onChange={e => setAuthForm({...authForm, specialty:e.target.value})}>{SPECIALTIES.map(s=><option key={s}>{s}</option>)}</select></label>
              <label>{t.studentId}<input value={authForm.student_number} onChange={e => setAuthForm({...authForm, student_number:e.target.value})}/></label>
            </>}
            <label>{t.email}<input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm,email:e.target.value})} autoComplete="email"/></label>
            <label>{t.password}<input type="password" required minLength={10} value={authForm.password} onChange={e => setAuthForm({...authForm,password:e.target.value})} autoComplete={authMode === 'login' ? 'current-password':'new-password'}/></label>
            <button className="btn-primary full-width" disabled={busy}>{busy ? t.loading : authMode === 'login' ? t.signIn : t.signUp}</button>
            <p className="form-footnote">{t.adminSetupDesc}</p>
          </form>
        </div> : <div className="portal-grid">
          <section className="card profile-card">
            <SectionTitle icon={<UserRound/>} title={t.profile}/>
            {profile ? <>
              <div className="profile-avatar"><UserRound size={38}/></div>
              <h3>{profile.full_name || session.user.email}</h3>
              <p className="muted">{profile.email || session.user.email}</p>
              <div className="profile-details">
                <p><span>{t.role}</span><strong>{t[profile.role] || profile.role}</strong></p>
                <p><span>{t.specialty}</span><strong>{profile.specialty || '—'}</strong></p>
                <p><span>{t.studentId}</span><strong>{profile.student_number || '—'}</strong></p>
                <p><span>{t.profileId}</span><strong className="id-text">{profile.id}</strong></p>
              </div>
              {profile.role === 'student' && <div className="student-card-mini digital-student-id">
                <div className="digital-id-top"><span>ENS DJELFA</span><span>{lang==='ar'?'بطاقة طالب جامعية':lang==='fr'?'CARTE ÉTUDIANTE':'STUDENT ID'}</span></div>
                <div className="digital-id-main"><div className="digital-id-photo"><UserRound size={34}/></div><div className="digital-id-data"><strong>{profile.full_name || 'Student'}</strong><small>{profile.specialty || '—'}</small><small>{lang==='ar'?'رقم الطالب':'Student No.'}: {profile.student_number || profile.id.slice(0,8).toUpperCase()}</small><small>{lang==='ar'?'السنة الجامعية':'Academic year'}: {new Date().getMonth() >= 8 ? new Date().getFullYear() : new Date().getFullYear()-1}/{new Date().getMonth() >= 8 ? new Date().getFullYear()+1 : new Date().getFullYear()}</small></div></div>
                <div className="digital-id-bottom"><span>{lang==='ar'?'ملحقة المدرسة العليا للأساتذة - الجلفة':'ENS Annex · Djelfa'}</span><span className="id-code-bars" aria-label="decorative card code">▥ ▥ ▥ ▥ ▥</span></div>
              </div>}
            </> : <p>{t.noProfile}</p>}
          </section>
          <div className="portal-main">
            <div className="card role-banner">
              <span className="role-icon">{isAdmin ? <ShieldCheck/> : isTeacher ? <BookOpen/> : <UserRound/>}</span>
              <div><h3>{isAdmin ? t.adminSpace : isTeacher ? t.teacherSpace : t.studentSpace}</h3><p>{isAdmin ? t.adminDesc : isTeacher ? t.teacherDesc : t.studentDesc}</p></div>
            </div>
            {profile?.role === 'student' && <section className="card attendance-dashboard"><SectionTitle icon={<CalendarDays/>} title={lang === 'ar' ? 'متابعة الحضور والغياب — السنة كاملة' : lang === 'fr' ? 'Suivi annuel des absences' : 'Full-year attendance tracker'}/><div className="attendance-stats"><div><strong>{attendanceSessions.length}</strong><span>{lang === 'ar' ? 'الحصص المسجلة' : 'Sessions'}</span></div><div><strong>{attendanceSessions.filter(a=>a.status==='absent').length}</strong><span>{lang === 'ar' ? 'غياب' : 'Absences'}</span></div><div><strong>{attendanceSessions.filter(a=>a.status==='present').length}</strong><span>{lang === 'ar' ? 'حضور' : 'Present'}</span></div><div><strong>{attendanceSessions.filter(a=>a.status==='late').length}</strong><span>{lang === 'ar' ? 'تأخر' : 'Late'}</span></div></div><div className="attendance-year"><h3>{new Date().getFullYear()} / {new Date().getFullYear()+1}</h3>{attendanceSessions.length ? <div className="attendance-record-list">{attendanceSessions.map((a,i)=><div className="attendance-record" key={a.id || i}><span className={`attendance-status ${a.status}`}>{a.status==='absent' ? (lang==='ar'?'غائب':lang==='fr'?'Absent':'Absent') : a.status==='late' ? (lang==='ar'?'متأخر':'Late') : (lang==='ar'?'حاضر':lang==='fr'?'Présent':'Present')}</span><div><strong>{a.session_title || a.title || (lang==='ar'?'حصة دراسية':'Class session')}</strong><small>{a.session_date} · {a.class_name || a.specialty || ''}</small></div></div>)}</div> : <p className="muted">{lang === 'ar' ? 'لا توجد غيابات مسجلة حتى الآن. ستظهر هنا مباشرة بعد حفظ الأستاذ للحصة.' : 'No attendance records yet.'}</p>}</div></section>}
            {isTeacher && <form className="card form-card" onSubmit={publishResource}>
              <SectionTitle icon={<Plus/>} title={t.addResource}/>
              <label>{t.title}<input required value={resourceForm.title} onChange={e => setResourceForm({...resourceForm,title:e.target.value})}/></label>
              <div className="form-row">
                <label>{t.specialty}<select value={resourceForm.specialty} onChange={e => setResourceForm({...resourceForm,specialty:e.target.value})}>{SPECIALTIES.map(s=><option key={s}>{s}</option>)}</select></label>
                <label>{t.category}<select value={resourceForm.kind} onChange={e => setResourceForm({...resourceForm,kind:e.target.value})}>{Object.entries(resourceTypeKeys).map(([k,v])=><option value={k} key={k}>{t[v]}</option>)}</select></label>
              </div>
              <label>{t.subject}<input value={resourceForm.subject} onChange={e => setResourceForm({...resourceForm,subject:e.target.value})}/></label>
              <label>{lang === 'ar' ? 'محتوى الدرس أو الملخص' : lang === 'fr' ? 'Contenu du cours ou résumé' : 'Lesson or summary content'}<textarea rows="6" value={resourceForm.description} onChange={e => setResourceForm({...resourceForm,description:e.target.value})} placeholder={lang === 'ar' ? 'اكتب محتوى الدرس هنا...' : 'Write lesson content here...'}/></label>
              <label>{lang === 'ar' ? 'ملف مرفق (اختياري)' : lang === 'fr' ? 'Fichier joint (facultatif)' : 'Attachment (optional)'}<input type="file" accept=".pdf,.doc,.docx,application/pdf"/><small className="muted">{t.fileHint}</small></label>
              <button className="btn-primary" disabled={busy}><UploadCloud size={17}/>{busy ? t.loading : t.upload}</button>
            </form>}
            {isTeacher && <form className="card form-card attendance-form" onSubmit={saveAttendance}><SectionTitle icon={<ClipboardCheck/>} title={lang==='ar'?'تسجيل الحضور والغياب':lang==='fr'?'Enregistrer les présences':'Record attendance'}/><div className="form-row"><label>{lang==='ar'?'عنوان الحصة':'Session title'}<input required value={attendanceForm.title} onChange={e=>setAttendanceForm({...attendanceForm,title:e.target.value})} placeholder={lang==='ar'?'مثال: أعمال موجهة 01':'e.g. Tutorial 01'}/></label><label>{lang==='ar'?'التاريخ':'Date'}<input type="date" required value={attendanceForm.session_date} onChange={e=>setAttendanceForm({...attendanceForm,session_date:e.target.value})}/></label></div><div className="form-row"><label>{t.specialty}<select value={attendanceForm.specialty} onChange={e=>{setAttendanceForm({...attendanceForm,specialty:e.target.value});setAttendanceMarks({});}}>{SPECIALTIES.map(s=><option key={s}>{s}</option>)}</select></label><label>{lang==='ar'?'الفوج / القسم':'Group / class'}<input value={attendanceForm.class_name} onChange={e=>setAttendanceForm({...attendanceForm,class_name:e.target.value})}/></label></div><p className="muted">{lang==='ar'?'تُعرض قائمة الطلبة المسجلين في تخصص حسابك. غيّر تخصصك في الملف الشخصي أو من الإدارة إذا لزم.':'Roster is filtered by the specialty on your profile.'}</p><div className="roster-list">{roster.map(st=><div className="roster-row" key={st.id}><div className="roster-person"><span className="roster-avatar"><UserRound size={17}/></span><span><strong>{st.full_name || st.email}</strong><small>{st.student_number || st.email}</small></span></div><select aria-label={`Attendance for ${st.full_name}`} value={attendanceMarks[st.id] || 'present'} onChange={e=>setAttendanceMarks({...attendanceMarks,[st.id]:e.target.value})}><option value="present">{lang==='ar'?'حاضر':'Present'}</option><option value="absent">{lang==='ar'?'غائب':'Absent'}</option><option value="late">{lang==='ar'?'متأخر':'Late'}</option></select></div>)}</div>{!roster.length && <p className="muted">{lang==='ar'?'لا توجد قائمة طلبة محمّلة. تأكد من صلاحية الأستاذ وتخصصه في Supabase.':'No students loaded for this specialty.'}</p>}<button className="btn-primary" disabled={attendanceBusy || !roster.length}><ClipboardCheck size={17}/>{attendanceBusy ? t.loading : (lang==='ar'?'حفظ الحصة وتأكيد الحضور':'Save session')}</button></form>}
            {isAdmin && <form className="card form-card" onSubmit={publishAnnouncement}>
              <SectionTitle icon={<Megaphone/>} title={t.addAnnouncement}/>
              <label>{t.title}<input required value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm,title:e.target.value})}/></label>
              <label>{t.announcementBody}<textarea required rows="4" value={announcementForm.body} onChange={e => setAnnouncementForm({...announcementForm,body:e.target.value})}/></label>
              <button className="btn-primary" disabled={busy}><Plus size={17}/>{busy ? t.loading : t.publish}</button>
            </form>}
            <div className="card">
              <SectionTitle icon={<BookOpen/>} title={t.materials}/>
              <p className="muted">{t.resourcesDesc}</p>
              <button className="btn-secondary" onClick={() => changeTab('library')}>{t.library}</button>
            </div>
            {isAdmin && <div className="card admin-note"><ShieldCheck size={20}/><div><strong>{t.adminSpace}</strong><p>{t.roleHelp}</p><p className="muted">{t.adminSetupDesc}</p></div></div>}
          </div>
        </div>}
      </section>}
      {lessonView && <div className="modal-backdrop" role="presentation" onClick={() => setLessonView(null)}><article className="card lesson-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}><button className="modal-close icon-button" onClick={() => setLessonView(null)} aria-label="Close"><X/></button><span className="eyebrow">{lessonView.specialty} · {lessonView.subject || lessonView.kind}</span><h2>{lessonView.title}</h2><p className="lesson-content">{lessonView.content || lessonView.description}</p>{lessonView.file_path && <button className="btn-primary" onClick={() => { const item=lessonView; setLessonView(null); openResource({...item,content:null,description:null}); }}><Download size={16}/>{t.download}</button>}</article></div>}
    </main>
    <footer><div className="footer-brand"><GraduationCap size={20}/><strong>{t.brand}</strong></div><p>{t.footer}</p></footer>
  </div>;
}

function LanguageSelect({ lang, setLang, t }) {
  return <label className="language-select" aria-label={t.language}><Globe size={16}/><select value={lang} onChange={e => setLang(e.target.value)}>
    <option value="ar">العربية</option><option value="fr">Français</option><option value="en">English</option>
  </select></label>;
}
function Feature({ icon, title, desc, onClick }) {
  return <button className="feature-card" onClick={onClick}><span className="feature-icon">{icon}</span><span className="feature-title">{title}</span><span className="feature-desc">{desc}</span></button>;
}
function SectionTitle({ icon, title }) { return <div className="section-title"><span>{icon}</span><h2>{title}</h2></div>; }
function EmptyState({ icon, text }) { return <div className="empty-state"><span>{icon}</span><p>{text}</p></div>; }
function Announcement({ item, t }) {
  return <article className="announcement-card"><div className="announcement-icon"><Megaphone size={19}/></div><div className="announcement-content">
    <h3>{item.title}</h3><p>{item.body}</p><small><Clock3 size={13}/>{new Date(item.created_at).toLocaleDateString()}</small>
  </div></article>;
}
function iconForSpecialty(item, t) {
  if (item === t.science) return <FlaskConical size={18}/>;
  if (item === t.math) return <Calculator size={18}/>;
  if (item === t.physics) return <Atom size={18}/>;
  if (item === t.computing) return <Monitor size={18}/>;
  if ([t.arabic, t.french, t.english].includes(item)) return <Languages size={18}/>;
  if (item === t.sport) return <Dumbbell size={18}/>;
  return <BookOpen size={18}/>;
}
export default App;
