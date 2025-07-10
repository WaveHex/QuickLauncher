import React, { useState, useEffect } from "react";
import { Profile, User } from "./types/Profile";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import Database from "@tauri-apps/plugin-sql";
import { open, save, open as openFile } from '@tauri-apps/plugin-dialog';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import packageJson from '../package.json';
import { sendNotification } from '@tauri-apps/plugin-notification';



const SIDEBAR_TABS = [
  { key: "profiles", label: "Профили", icon: "📁" },
  { key: "about", label: "О нас", icon: "ℹ️" },
  { key: "settings", label: "Настройки", icon: "⚙️" },
];

const dbPromise = Database.load("sqlite:quicklauncher.db");

const themeOptions = [
  { value: 'dark', label: 'Тёмная' },
  { value: 'light', label: 'Светлая' },
  { value: 'blue', label: 'Синяя' },
  { value: 'green', label: 'Зелёная' },
  { value: 'red', label: 'Красная' },
];

const fontOptions = [
  { value: 'Inter, Segoe UI, Arial, sans-serif', label: 'Inter' },
  { value: 'Segoe UI, Arial, sans-serif', label: 'Segoe UI' },
  { value: 'Roboto, Arial, sans-serif', label: 'Roboto' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'monospace', label: 'Monospace' },
];

const bgTypeOptions = [
  { value: 'theme', label: 'Тема' },
  { value: 'color', label: 'Цвет' },
  { value: 'image', label: 'Изображение' },
];

// Toast-компонент
const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      right: 32,
      background: '#23242b',
      color: '#fff',
      padding: '16px 24px',
      borderRadius: 8,
      boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
      zIndex: 9999,
      fontSize: 16,
      animation: 'toastIn 0.3s'
    }}>
      {message}
    </div>
  );
};

function App() {
  const [theme] = useState("dark");
  const [activeTab, setActiveTab] = useState("profiles");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileCategory, setNewProfileCategory] = useState("");
  const [newProfileBgType, setNewProfileBgType] = useState<'color' | 'gradient' | 'image'>('color');
  const [newProfileBgValue, setNewProfileBgValue] = useState<string>("#6c63ff");
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editActions, setEditActions] = useState<Profile["actions"]>([]);
  const [newActionType, setNewActionType] = useState<"app" | "url" | "cmd" | "folder" | "file">("app");
  const [newActionValue, setNewActionValue] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userNameInput, setUserNameInput] = useState("");
  const [settingsName, setSettingsName] = useState("");
  const [settingsAvatar, setSettingsAvatar] = useState<string | undefined>(undefined);
  const [settingsTheme, setSettingsTheme] = useState<string>("dark");
  const [autostart, setAutostart] = useState<boolean>(false);
  const [bgType, setBgType] = useState<'theme' | 'color' | 'image'>(localStorage.getItem('bgType') as 'theme' | 'color' | 'image' || 'theme');
  const [bgColor, setBgColor] = useState(localStorage.getItem('bgColor') || '#181a20');
  const [bgImage, setBgImage] = useState(localStorage.getItem('bgImage') || '');
  const [fontFamily, setFontFamily] = useState(localStorage.getItem('fontFamily') || fontOptions[0].value);
  const [notificationsEnabled, setNotificationsEnabled] = useState(localStorage.getItem('notifications') !== 'off');
  const [toast, setToast] = useState<string | null>(null);
  const [editBgType, setEditBgType] = useState<'color' | 'gradient' | 'image'>('color');
  const [editBgValue, setEditBgValue] = useState<string>("#6c63ff");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    (async () => {
      const db = await dbPromise;
      // Ensure user table exists
      await db.execute("CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, name TEXT)");
      // Try to load user
      const userRows = await db.select("SELECT * FROM user LIMIT 1") as any[];
      if (userRows.length > 0) {
        setUser({ name: userRows[0].name });
      } else {
        setShowUserModal(true);
      }
      try {
        await db.execute("ALTER TABLE profiles ADD COLUMN bg_type TEXT");
      } catch (e) {}
      try {
        await db.execute("ALTER TABLE profiles ADD COLUMN bg_value TEXT");
      } catch (e) {}
      try {
        await db.execute("ALTER TABLE user ADD COLUMN avatar TEXT");
      } catch (e) {}
      const rows = await db.select("SELECT * FROM profiles");
      const arr = rows as any[];
      setProfiles(
        arr.map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          actions: JSON.parse(row.actions_json),
          bgType: row.bg_type,
          bgValue: row.bg_value
        }))
      );
    })();
  }, []);

  useEffect(() => {
    if (activeTab === "settings" && user) {
      setSettingsName(user.name);
      setSettingsAvatar(user.avatar);
      setSettingsTheme(localStorage.getItem("theme") || "dark");
      isEnabled().then(setAutostart);
    }
  }, [activeTab, user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setSettingsTheme(savedTheme);
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-green', 'theme-red');
    document.body.classList.add(`theme-${savedTheme}`);
  }, []);

  useEffect(() => {
    if (bgType === 'color') {
      document.body.style.background = bgColor;
      document.body.style.backgroundImage = '';
    } else if (bgType === 'image' && bgImage) {
      document.body.style.background = '';
      document.body.style.backgroundImage = `url('${bgImage.startsWith('/') ? bgImage : convertFileSrc(bgImage)}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
    }
    document.body.style.fontFamily = fontFamily;
  }, [bgType, bgColor, bgImage, fontFamily]);

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    const newProfile: Profile = {
      id: uuidv4(),
      name: newProfileName,
      category: newProfileCategory,
      actions: [],
      bgType: newProfileBgType,
      bgValue: newProfileBgValue
    };
    setProfiles((prev) => [...prev, newProfile]);
    setShowAddProfile(false);
    setNewProfileName("");
    setNewProfileCategory("");
    setNewProfileBgType('color');
    setNewProfileBgValue("#6c63ff");
    const db = await dbPromise;
    await db.execute(
      "INSERT INTO profiles (id, name, category, actions_json, bg_type, bg_value) VALUES (?, ?, ?, ?, ?, ?)",
      [newProfile.id, newProfile.name, newProfile.category, JSON.stringify(newProfile.actions), newProfile.bgType, newProfile.bgValue]
    );
  };

  const handleDeleteProfile = async (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    const db = await dbPromise;
    await db.execute("DELETE FROM profiles WHERE id = ?", [id]);
  };

  const handleEditProfile = (profile: Profile) => {
    setEditProfile(profile);
    setEditName(profile.name);
    setEditCategory(profile.category);
    setEditActions(profile.actions);
    setNewActionType("app");
    setNewActionValue("");
    setEditBgType('color');
    setEditBgValue(profile.bgValue || '#6c63ff');
  };

  const handleSaveEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfile) return;
    const updated: Profile = {
      ...editProfile,
      name: editName,
      category: editCategory,
      actions: editActions,
      bgType: editBgType,
      bgValue: editBgValue
    };
    try {
      const db = await dbPromise;
      await db.execute(
        "UPDATE profiles SET name = ?, category = ?, actions_json = ?, bg_type = ?, bg_value = ? WHERE id = ?",
        [updated.name, updated.category, JSON.stringify(updated.actions), updated.bgType, updated.bgValue, updated.id]
      );
      setProfiles((prev) => prev.map((p) =>
        p.id === editProfile.id ? updated : p
      ));
      setEditProfile(null);
    } catch (e) {
      alert("Ошибка при сохранении профиля: " + e);
      console.error(e);
    }
  };

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionValue.trim()) return;
    let action: Profile["actions"][number];
    switch (newActionType) {
      case "app":
      case "folder":
      case "file":
        action = { type: newActionType, path: newActionValue };
        break;
      case "url":
        action = { type: "url", url: newActionValue };
        break;
      case "cmd":
        action = { type: "cmd", command: newActionValue };
        break;
      default:
        return;
    }
    setEditActions((prev: Profile["actions"]) => [...prev, action]);
    setNewActionValue("");
  };

  const handleDeleteAction = (idx: number) => {
    setEditActions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRunProfile = async (profile: Profile) => {
    for (const action of profile.actions) {
      try {
        switch (action.type) {
          case 'app':
          case 'file':
          case 'folder':
            await invoke('run_app', { path: action.path });
            break;
          case 'url':
            await invoke('open_url', { url: action.url });
            break;
          case 'cmd':
            await invoke('run_cmd', { command: action.command });
            break;
        }
      } catch (e) {
        if (notificationsEnabled) {
          showToast('Ошибка запуска действия!');
        }
      }
    }
    if (notificationsEnabled) {
      showToast(`Профиль "${profile.name}" успешно запущен!`);
    }
  };

  const handleUserNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNameInput.trim()) return;
    const db = await dbPromise;
    await db.execute("INSERT INTO user (name) VALUES (?)", [userNameInput]);
    setUser({ name: userNameInput });
    setShowUserModal(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsName.trim()) return;
    const db = await dbPromise;
    await db.execute("UPDATE user SET name = ?, avatar = ?", [settingsName, settingsAvatar || null]);
    const userRows = await db.select("SELECT * FROM user LIMIT 1") as any[];
    if (userRows.length > 0) {
      setUser({ name: userRows[0].name, avatar: userRows[0].avatar });
    }
    setShowUserModal(false);
    if (notificationsEnabled) sendNotification({ title: 'QuickLauncher', body: 'Настройки успешно сохранены!' });
  };

  const handlePickUserAvatar = async () => {
    const selected = await open({ multiple: false, filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] }] });
    if (typeof selected === 'string') setSettingsAvatar(selected);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    setSettingsTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-green', 'theme-red');
    document.body.classList.add(`theme-${newTheme}`);
    if (notificationsEnabled) sendNotification({ title: 'QuickLauncher', body: `Тема изменена на "${themeOptions.find(t => t.value === newTheme)?.label || newTheme}"` });
  };

  const handleAutostartToggle = async () => {
    if (autostart) {
      await disable();
      setAutostart(false);
    } else {
      await enable();
      setAutostart(true);
    }
  };

  const handleExportProfiles = async () => {
    const db = await dbPromise;
    const rows = await db.select("SELECT * FROM profiles");
    const json = JSON.stringify(rows, null, 2);
    const filePath = await save({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: 'profiles.json',
    });
    if (filePath) {
      await writeTextFile(filePath, json);
      if (notificationsEnabled) sendNotification({ title: 'QuickLauncher', body: 'Профили успешно экспортированы!' });
    }
  };

  const handleImportProfiles = async () => {
    const filePath = await openFile({ multiple: false, filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (typeof filePath === 'string') {
      const json = await readTextFile(filePath);
      let arr;
      try {
        arr = JSON.parse(json);
      } catch {
        alert('Ошибка чтения файла!');
        return;
      }
      if (!Array.isArray(arr)) {
        alert('Некорректный формат файла!');
        return;
      }
      const db = await dbPromise;
      // Можно сделать replace или merge, здесь replace:
      await db.execute("DELETE FROM profiles");
      for (const row of arr) {
        await db.execute(
          "INSERT INTO profiles (id, name, category, actions_json, bg_type, bg_value) VALUES (?, ?, ?, ?, ?, ?)",
          [row.id, row.name, row.category, row.actions_json, row.bg_type, row.bg_value]
        );
      }
      // Обновить состояние
      const rows = await db.select("SELECT * FROM profiles");
      setProfiles(
        (rows as any[]).map((row: any) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          actions: JSON.parse(row.actions_json),
          bgType: row.bg_type,
          bgValue: row.bg_value
        }))
      );
      if (notificationsEnabled) sendNotification({ title: 'QuickLauncher', body: 'Профили успешно импортированы!' });
    }
  };

  const handleFactoryReset = async () => {
    if (!window.confirm('Вы уверены? Все данные будут удалены!')) return;
    const db = await dbPromise;
    await db.execute("DELETE FROM user");
    await db.execute("DELETE FROM profiles");
    setUser(null);
    setShowUserModal(true);
    setProfiles([]);
    if (notificationsEnabled) sendNotification({ title: 'QuickLauncher', body: 'Все данные приложения сброшены!' });
  };

  const handleBgTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBgType(e.target.value as 'theme' | 'color' | 'image');
    localStorage.setItem('bgType', e.target.value);
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBgColor(e.target.value);
    localStorage.setItem('bgColor', e.target.value);
    if (notificationsEnabled) sendNotification({ title: 'QuickLauncher', body: 'Фоновый цвет изменён!' });
  };

  const handlePickBgImage = async (setBgValue: (path: string) => void) => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] }]
    });
    if (typeof selected === 'string') setBgValue(selected);
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(e.target.value);
    localStorage.setItem('fontFamily', e.target.value);
    if (notificationsEnabled) sendNotification({ title: 'QuickLauncher', body: 'Шрифт интерфейса изменён!' });
  };

  const handleResetCustomization = () => {
    setBgType('theme');
    setBgColor('#181a20');
    setBgImage('');
    setFontFamily(fontOptions[0].value);
    localStorage.removeItem('bgType');
    localStorage.removeItem('bgColor');
    localStorage.removeItem('bgImage');
    localStorage.removeItem('fontFamily');
    if (notificationsEnabled) sendNotification({ title: 'QuickLauncher', body: 'Кастомизация сброшена!' });
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled((prev) => {
      localStorage.setItem('notifications', prev ? 'off' : 'on');
      return !prev;
    });
  };

  const showToast = (msg: string) => setToast(msg);

  return (
    <div
      className="app-layout"
      style={{
        backgroundColor: bgType === 'color' ? bgColor : undefined,
        backgroundImage: bgType === 'image' && bgImage ? `url('${bgImage.startsWith('/') ? bgImage : convertFileSrc(bgImage)}')` : undefined,
        backgroundSize: bgType === 'image' && bgImage ? 'cover' : undefined,
        backgroundPosition: bgType === 'image' && bgImage ? 'center' : undefined,
        fontFamily: fontFamily,
        minHeight: '100vh'
      }}
    >
      {showUserModal && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <form className="modal-form stylish-form" onSubmit={handleUserNameSubmit} style={{ minWidth: 320, textAlign: 'center', animation: 'popIn 0.3s cubic-bezier(.4,2,.6,1)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#6c63ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 32, marginBottom: 10, boxShadow: '0 2px 12px rgba(108,99,255,0.18)' }}>
                {userNameInput ? userNameInput[0].toUpperCase() : '🙂'}
              </div>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.3rem' }}>Добро пожаловать!</h2>
              <div style={{ color: '#aaa', fontSize: 15, marginTop: 4, marginBottom: 10 }}>Введите ваше имя для персонализации приложения</div>
            </div>
            <input
              type="text"
              placeholder="Ваше имя..."
              value={userNameInput}
              onChange={e => setUserNameInput(e.target.value)}
              required
              className="modal-input stylish-input"
              autoFocus
              style={{ textAlign: 'center', fontSize: 18, marginBottom: 18 }}
              maxLength={32}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.form?.requestSubmit(); }}
            />
            <button type="submit" className="modal-submit stylish-btn-submit" style={{ width: '100%', fontSize: 17, padding: '0.7em 0' }} disabled={!userNameInput.trim()}>
              Продолжить
            </button>
          </form>
        </div>
      )}
      <aside className="sidebar">
        <div className="sidebar-logo">QuickLauncher</div>
        <nav className="sidebar-nav">
          {SIDEBAR_TABS.map(tab => (
            <button
              key={tab.key}
              className={`sidebar-nav-btn${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">v1.0.0</div>
      </aside>
      <div className="main-content">
        <header className="header">
          <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>
            {activeTab === "profiles" && "Ваши профили"}
            {activeTab === "about" && "О нас"}
            {activeTab === "settings" && "Настройки"}
          </div>
          <div className="header-user">
            <span className="user-name">{user?.name || ""}</span>
          </div>
        </header>
        <main style={{ flex: 1, padding: "2.5rem 2rem" }}>
          {activeTab === "profiles" && (
            <>
              <div className="section-title">Профили</div>
              <button className="add-profile-btn" onClick={() => setShowAddProfile(true)}>
                + Добавить профиль
              </button>
              {profiles.length === 0 ? (
                <div className="profiles-empty">Нет профилей. Добавьте первый!</div>
              ) : (
                <div className="profiles-list">
                  {profiles.map((profile) => {
                    return (
                      <div
                        key={profile.id}
                        className="profile-card profile-card-list stylish-profile-card"
                        style={{ background: profile.bgValue || '#6c63ff' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: profile.bgValue || '#6c63ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, border: '2px solid #fff', flexDirection: 'column' }}>
                            {profile.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="profile-name">{profile.name}</div>
                            <div className="profile-category">{profile.category}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginLeft: 'auto' }}>
                          <button
                            className="run-profile-btn stylish-profile-btn"
                            onClick={() => handleRunProfile(profile)}
                            title="Запустить профиль"
                          >
                            ▶ Запустить
                          </button>
                          <button
                            className="edit-profile-btn stylish-profile-btn"
                            onClick={() => handleEditProfile(profile)}
                            title="Редактировать профиль"
                          >
                            ✎
                          </button>
                          <button
                            className="delete-profile-btn stylish-profile-btn"
                            onClick={() => handleDeleteProfile(profile.id)}
                            title="Удалить профиль"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {activeTab === "about" && (
            <div style={{ maxWidth: 500, margin: '2rem auto', background: '#23242b', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', padding: '2.5rem 2rem', textAlign: 'center' }}>
              <h2 style={{ marginBottom: 16 }}>О проекте QuickLauncher</h2>
              <div style={{ color: '#ccc', fontSize: 17, marginBottom: 18 }}>
                QuickLauncher — это современный лаунчер для быстрого запуска приложений, файлов, папок и команд.<br/><br/>
                <b>Возможности:</b><br/>
                • Профили с действиями<br/>
                • Кастомизация (аватар, цвет, имя)<br/>
                • Экспорт/импорт профилей<br/>
                • Автозапуск, смена темы<br/>
                <br/>
                <b>Авторы:</b> Ruffiks и команда<br/>
              </div>
              <div style={{ color: '#888', fontSize: 15, marginBottom: 10 }}>Версия: {packageJson.version}</div>
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#6c63ff', textDecoration: 'underline', fontSize: 16 }}>Репозиторий проекта</a>
            </div>
          )}
          {activeTab === "settings" && (
            <form className="settings-form stylish-form" onSubmit={handleSaveSettings} style={{ maxWidth: 480, margin: '2rem auto', background: '#23242b', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.13)', padding: '2.5rem 2rem' }}>
              <h2 style={{ textAlign: 'center', marginBottom: 28 }}>Настройки</h2>
              {/* --- Пользователь --- */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, color: '#6c63ff' }}>Пользователь</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#6c63ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 32, boxShadow: '0 2px 12px rgba(108,99,255,0.18)', position: 'relative' }}>
                    {settingsAvatar ? (
                      <img src={settingsAvatar.startsWith('/') ? settingsAvatar : convertFileSrc(settingsAvatar)} alt="avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', background: '#fff' }} />
                    ) : (
                      settingsName[0]?.toUpperCase() || '🙂'
                    )}
                    <button type="button" onClick={handlePickUserAvatar} style={{ position: 'absolute', bottom: -8, right: -8, background: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }} title="Сменить аватарку">✎</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    value={settingsName}
                    onChange={e => setSettingsName(e.target.value)}
                    required
                    className="modal-input stylish-input"
                    style={{ textAlign: 'center', fontSize: 18, width: '100%' }}
                    maxLength={32}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ color: '#eee', fontWeight: 500 }}>Автозапуск</span>
                  <button type="button" onClick={handleAutostartToggle} className="stylish-btn-add" style={{ minWidth: 90 }}>{autostart ? 'Вкл' : 'Выкл'}</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ color: '#eee', fontWeight: 500 }}>Тема</span>
                  <select value={settingsTheme} onChange={handleThemeChange} className="stylish-select" style={{ minWidth: 110 }}>
                    {themeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                  <input type="checkbox" id="notif" checked={notificationsEnabled} onChange={handleNotificationsToggle} className="notif-checkbox" />
                  <label htmlFor="notif" className="notif-label">Показывать уведомления</label>
                </div>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '24px 0' }} />
              {/* --- Кастомизация интерфейса --- */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, color: '#6c63ff' }}>Кастомизация интерфейса</div>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ color: '#eee', fontWeight: 500, marginBottom: 6 }}>Фон</div>
                  <select value={bgType} onChange={handleBgTypeChange} className="stylish-select" style={{ minWidth: 110, marginBottom: 8 }}>
                    {bgTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {bgType === 'color' && (
                    <input type="color" value={bgColor} onChange={handleBgColorChange} style={{ marginLeft: 12, width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', verticalAlign: 'middle' }} />
                  )}
                  {bgType === 'image' && (
                    <button type="button" className="stylish-btn-add" style={{ marginLeft: 12 }} onClick={() => handlePickBgImage(setBgImage)}>Выбрать изображение</button>
                  )}
                  {bgType === 'image' && bgImage && (
                    <div style={{ marginTop: 8 }}>
                      <img src={bgImage.startsWith('/') ? bgImage : convertFileSrc(bgImage)} alt="bg preview" style={{ maxWidth: 180, maxHeight: 80, borderRadius: 8, border: '1px solid #444' }} />
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ color: '#eee', fontWeight: 500, marginBottom: 6 }}>Шрифт</div>
                  <select value={fontFamily} onChange={handleFontChange} className="stylish-select" style={{ minWidth: 140 }}>
                    {fontOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <button type="button" className="stylish-btn-cancel" style={{ width: '100%', marginBottom: 10 }} onClick={handleResetCustomization}>Сбросить кастомизацию</button>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '24px 0' }} />
              {/* --- Профили --- */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, color: '#6c63ff' }}>Профили</div>
                <button type="button" className="stylish-btn-add" style={{ width: '100%', marginBottom: 10 }} onClick={handleExportProfiles}>Экспорт профилей</button>
                <button type="button" className="stylish-btn-add" style={{ width: '100%', marginBottom: 10 }} onClick={handleImportProfiles}>Импорт профилей</button>
                <button type="button" className="stylish-btn-cancel" style={{ width: '100%', marginBottom: 10 }} onClick={handleFactoryReset}>Сбросить все данные</button>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '24px 0' }} />
              {/* --- О приложении --- */}
              <div style={{ textAlign: 'center', color: '#888', fontSize: 14, marginTop: 18 }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8, color: '#6c63ff' }}>О приложении</div>
                <div>Версия: {packageJson.version}</div>
                <a href="https://github.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#6c63ff', textDecoration: 'underline', fontSize: 16 }}>Репозиторий проекта</a>
              </div>
              <button type="submit" className="modal-submit stylish-btn-submit" style={{ width: '100%', fontSize: 17, padding: '0.7em 0', marginTop: 28 }}>Сохранить</button>
            </form>
          )}
        </main>
      </div>
      {showAddProfile && (
        <div className="modal-overlay">
          <form className="modal-form" onSubmit={handleAddProfile}>
            <h2>Новый профиль</h2>
            <input
              type="text"
              placeholder="Название профиля"
              value={newProfileName}
              onChange={e => setNewProfileName(e.target.value)}
              required
              className="modal-input"
            />
            <input
              type="text"
              placeholder="Категория (например, Работа, Игры)"
              value={newProfileCategory}
              onChange={e => setNewProfileCategory(e.target.value)}
              className="modal-input"
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button type="button" className={`bgtype-tab${newProfileBgType === 'color' ? ' active' : ''}`} onClick={() => setNewProfileBgType('color')}>Цвет</button>
              <button type="button" className={`bgtype-tab${newProfileBgType === 'gradient' ? ' active' : ''}`} onClick={() => setNewProfileBgType('gradient')}>Градиент</button>
              <button type="button" className={`bgtype-tab${newProfileBgType === 'image' ? ' active' : ''}`} onClick={() => setNewProfileBgType('image')}>Картинка</button>
            </div>
            {newProfileBgType === 'color' && (
              <input type="color" value={newProfileBgValue} onChange={e => setNewProfileBgValue(e.target.value)} title="Цвет фона" style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
            )}
            {newProfileBgType === 'gradient' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {["linear-gradient(135deg,#6c63ff,#23242b)", "linear-gradient(135deg,#ff6c6c,#ffd86c)", "linear-gradient(135deg,#43e97b,#38f9d7)", "linear-gradient(135deg,#fa8bff,#2bd2ff)", "linear-gradient(135deg,#f7971e,#ffd200)"]
                  .map(g => (
                    <div key={g} onClick={() => setNewProfileBgValue(g)} style={{ width: 36, height: 36, borderRadius: '50%', background: g, border: newProfileBgValue === g ? '2px solid #6c63ff' : '2px solid #eee', cursor: 'pointer' }} />
                  ))}
              </div>
            )}
            {newProfileBgType === 'image' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {["/public/bg1.jpg", "/public/bg2.jpg", "/public/bg3.jpg"].map(img => (
                  <div key={img} onClick={() => setNewProfileBgValue(img)} style={{ width: 36, height: 36, borderRadius: '50%', background: `url(${img}) center/cover no-repeat`, border: newProfileBgValue === img ? '2px solid #6c63ff' : '2px solid #eee', cursor: 'pointer' }} />
                ))}
                <button
                  type="button"
                  onClick={() => handlePickBgImage(setNewProfileBgValue)}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: '2px dashed #aaa', background: 'none', cursor: 'pointer', fontSize: 18 }}
                >+</button>
              </div>
            )}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '3px solid #6c63ff',
                background:
                  newProfileBgType === 'color'
                    ? newProfileBgValue
                    : newProfileBgType === 'gradient'
                    ? newProfileBgValue
                    : newProfileBgType === 'image'
                    ? `url(${newProfileBgValue}) center/cover no-repeat`
                    : '#6c63ff',
                boxShadow: '0 2px 12px rgba(108,99,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 32,
                position: 'relative',
                overflow: 'hidden',
                marginBottom: 12
              }}
            >
              {newProfileBgType === 'image' && newProfileBgValue && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.25)',
                    zIndex: 1,
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 2 }}>
                {newProfileName?.[0]?.toUpperCase() || '?'}
              </span>
              {newProfileBgType === 'image' && newProfileBgValue && (
                <button
                  onClick={() => setNewProfileBgValue('')}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    cursor: 'pointer',
                    zIndex: 3,
                  }}
                  title="Удалить картинку"
                >
                  ×
                </button>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setShowAddProfile(false)}>
                Отмена
              </button>
              <button type="submit" className="modal-submit">
                Добавить
              </button>
            </div>
          </form>
        </div>
      )}
      {editProfile && (
        <div className="modal-overlay stylish-modal">
          <form className="modal-form stylish-form" onSubmit={handleSaveEditProfile}>
            <button type="button" className="modal-close stylish-close" aria-label="Закрыть" onClick={() => setEditProfile(null)}>
              ×
            </button>
            <h2 className="modal-title stylish-title">Редактировать профиль</h2>
            <input
              type="text"
              placeholder="Название профиля"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              required
              className="modal-input stylish-input"
            />
            <input
              type="text"
              placeholder="Категория (например, Работа, Игры)"
              value={editCategory}
              onChange={e => setEditCategory(e.target.value)}
              className="modal-input stylish-input"
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button type="button" className={`bgtype-tab${editBgType === 'color' ? ' active' : ''}`} onClick={() => setEditBgType('color')}>Цвет</button>
              <button type="button" className={`bgtype-tab${editBgType === 'gradient' ? ' active' : ''}`} onClick={() => setEditBgType('gradient')}>Градиент</button>
              <button type="button" className={`bgtype-tab${editBgType === 'image' ? ' active' : ''}`} onClick={() => setEditBgType('image')}>Картинка</button>
            </div>
            {editBgType === 'color' && (
              <input type="color" value={editBgValue} onChange={e => setEditBgValue(e.target.value)} title="Цвет фона" style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer' }} />
            )}
            {editBgType === 'gradient' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {["linear-gradient(135deg,#6c63ff,#23242b)", "linear-gradient(135deg,#ff6c6c,#ffd86c)", "linear-gradient(135deg,#43e97b,#38f9d7)", "linear-gradient(135deg,#fa8bff,#2bd2ff)", "linear-gradient(135deg,#f7971e,#ffd200)"]
                  .map(g => (
                    <div key={g} onClick={() => setEditBgValue(g)} style={{ width: 36, height: 36, borderRadius: '50%', background: g, border: editBgValue === g ? '2px solid #6c63ff' : '2px solid #eee', cursor: 'pointer' }} />
                  ))}
              </div>
            )}
            {editBgType === 'image' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {["/public/bg1.jpg", "/public/bg2.jpg", "/public/bg3.jpg"].map(img => (
                  <div key={img} onClick={() => setEditBgValue(img)} style={{ width: 36, height: 36, borderRadius: '50%', background: `url(${img}) center/cover no-repeat`, border: editBgValue === img ? '2px solid #6c63ff' : '2px solid #eee', cursor: 'pointer' }} />
                ))}
                <button
                  type="button"
                  onClick={() => handlePickBgImage(setEditBgValue)}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: '2px dashed #aaa', background: 'none', cursor: 'pointer', fontSize: 18 }}
                >+</button>
              </div>
            )}
            <div style={{ width: 48, height: 48, borderRadius: '50%',
              background: editBgType === 'color' ? editBgValue :
                         editBgType === 'gradient' ? editBgValue :
                         editBgType === 'image' ? `url(${editBgValue}) center/cover no-repeat` : '#6c63ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
              {editName?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="modal-actions-list stylish-actions-list">
              <div className="modal-actions-title stylish-actions-title">Действия профиля:</div>
              <ul className="modal-actions-ul stylish-actions-ul">
                {editActions.map((action, idx) => (
                  <li key={idx} className="modal-action-item stylish-action-item">
                    <span className="action-type stylish-action-type">{action.type === 'app' && 'Приложение: '}
                      {action.type === 'folder' && 'Папка: '}
                      {action.type === 'file' && 'Файл: '}
                      {action.type === 'url' && 'URL: '}
                      {action.type === 'cmd' && 'Команда: '}
                    </span>
                    <span className="action-value stylish-action-value">
                      {action.type === 'app' && action.path}
                      {action.type === 'folder' && action.path}
                      {action.type === 'file' && action.path}
                      {action.type === 'url' && action.url}
                      {action.type === 'cmd' && action.command}
                    </span>
                    <button type="button" className="action-delete stylish-action-delete" onClick={() => handleDeleteAction(idx)}>
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
              <div className="modal-add-action stylish-add-action">
                <select value={newActionType} onChange={e => setNewActionType(e.target.value as any)} className="stylish-select">
                  <option value="app">Приложение</option>
                  <option value="folder">Папка</option>
                  <option value="file">Файл</option>
                  <option value="url">URL</option>
                  <option value="cmd">Команда</option>
                </select>
                <input
                  type="text"
                  placeholder="Путь, URL или команда"
                  value={newActionValue}
                  onChange={e => setNewActionValue(e.target.value)}
                  className="stylish-input"
                />
                <button type="button" className="stylish-btn-add" onClick={handleAddAction}>
                  +
                </button>
              </div>
            </div>
            <div className="modal-actions stylish-modal-actions">
              <button type="button" className="modal-cancel stylish-btn-cancel" onClick={() => setEditProfile(null)}>
                Отмена
              </button>
              <button type="submit" className="modal-submit stylish-btn-submit">
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default App;