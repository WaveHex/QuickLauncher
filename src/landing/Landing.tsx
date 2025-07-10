import styles from './Landing.module.css';
import appLogo from '../../src-tauri/icons/icon.ico';
import { Rocket, Palette, Bell, Shield, Download, Github, Heart } from 'lucide-react';
import { useEffect } from 'react';
import mainScreenshot from './screenshots/main.png';
import SettingsScreenshot from './screenshots/Settings.png';
import BloopScreenshot from './screenshots/Bloop.png';

const features = [
  {
    icon: <Rocket size={36} strokeWidth={2.2} />, // Мгновенный запуск
    title: 'Мгновенный запуск',
    desc: 'Запускайте приложения, файлы и команды в один клик.'
  },
  {
    icon: <Palette size={36} strokeWidth={2.2} />, // Кастомизация
    title: 'Кастомизация',
    desc: 'Настраивайте фон, шрифты, цвета и внешний вид под себя.'
  },
  {
    icon: <Bell size={36} strokeWidth={2.2} />, // Уведомления
    title: 'Уведомления',
    desc: 'Получайте важные уведомления через системный трей и toast.'
  },
  {
    icon: <Shield size={36} strokeWidth={2.2} />, // Безопасность
    title: 'Безопасность',
    desc: 'Работает локально, не требует интернета и не собирает данные.'
  },
];

const steps = [
  {
    num: 1,
    title: 'Скачайте QuickLauncher',
    desc: 'Установите приложение на свой компьютер.'
  },
  {
    num: 2,
    title: 'Создайте профиль',
    desc: 'Добавьте свои приложения, файлы и команды.'
  },
  {
    num: 3,
    title: 'Запускайте в один клик',
    desc: 'Используйте быстрый поиск.'
  },
];

const faqs = [
  {
    q: 'На каких платформах работает?',
    a: 'QuickLauncher поддерживает Windows (поддержка других ОС в планах).'
  },
  {
    q: 'Это бесплатно?',
    a: 'Да, приложение полностью бесплатно и с открытым исходным кодом.'
  },
  {
    q: 'Где хранятся мои данные?',
    a: 'Все данные хранятся только на вашем устройстве.'
  },
];

const gallery = [
  mainScreenshot,
  SettingsScreenshot,
  BloopScreenshot,
];

const GITHUB_RELEASE_URL = 'https://github.com/yourusername/quicklauncher/releases/latest';

// Анимация появления секций при скролле
function useSectionFadeIn() {
  useEffect(() => {
    const sections = document.querySelectorAll('[data-animate]');
    const onScroll = () => {
      sections.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 80) {
          (el as HTMLElement).style.opacity = '1';
          (el as HTMLElement).style.transform = 'none';
        }
      });
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}

export default function Landing() {
  useSectionFadeIn();
  return (
    <div className={styles.landingRoot}>
      <header className={styles.hero}>
        <img src={appLogo} alt="QuickLauncher logo" className={styles.logo} />
        <div className={styles.title}>
          <span className={styles.gradientText}>QuickLauncher</span>
        </div>
        <div className={styles.subtitle}>
          Быстрый запуск приложений, файлов и команд.<br />
          Минимализм, кастомизация, удобство.
        </div>
        <a href={GITHUB_RELEASE_URL} target="_blank" rel="noopener noreferrer">
          <button className={styles.downloadBtn}>
            <Download size={20} style={{marginRight:8,marginBottom:-3}} /> Скачать
          </button>
        </a>
      </header>

      <section className={styles.section} data-animate>
        <div className={styles.sectionTitle}>Возможности</div>
        <div className={styles.features}>
          {features.map((f, i) => (
            <div className={styles.featureCard} key={i}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} data-animate>
        <div className={styles.sectionTitle}>Галерея</div>
        <div className={styles.gallery}>
          {gallery.map((src, i) => (
            <img src={src} alt={`Скриншот ${i+1}`} className={styles.galleryImg} key={i} />
          ))}
        </div>
      </section>

      <section className={styles.section} data-animate>
        <div className={styles.sectionTitle}>Как это работает?</div>
        <div className={styles.steps}>
          {steps.map((s, i) => (
            <div className={styles.stepCard} key={i}>
              <div className={styles.stepNum}>{s.num}</div>
              <div className={styles.stepTitle}>{s.title}</div>
              <div className={styles.stepDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} data-animate>
        <div className={styles.sectionTitle}>FAQ</div>
        <div className={styles.faq}>
          {faqs.map((f, i) => (
            <div className={styles.faqItem} key={i}>
              <div className={styles.faqQ}>{f.q}</div>
              <div className={styles.faqA}>{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerRow}>
          <a href="https://github.com/yourusername/quicklauncher" target="_blank" rel="noopener noreferrer" className={styles.footerIcon}><Github size={20} /></a>
          <span className={styles.footerText}>© {new Date().getFullYear()} QuickLauncher</span>
          <span className={styles.footerIcon}><Heart size={18} color="#e25555" fill="#e25555" style={{verticalAlign:'middle'}} /></span>
        </div>
        <div className={styles.footerSub}>Иконка и приложение — CC BY-SA 4.0</div>
      </footer>
    </div>
  );
} 