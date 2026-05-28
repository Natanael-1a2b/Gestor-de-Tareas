import { Mail, MessageCircle, ExternalLink } from 'lucide-react';

import React from 'react';

const GithubIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const SOCIAL_LINKS = [
  { 
    href: 'https://github.com/natanael-1a2b', 
    icon: GithubIcon, 
    label: 'GitHub',
    title: 'Ver mis proyectos en GitHub'
  },
  { 
    href: 'https://www.linkedin.com/in/claudio-natanael-beltre-rosario-38a580327', 
    icon: LinkedinIcon, 
    label: 'LinkedIn',
    title: 'Conectar en LinkedIn'
  },
  { 
    href: 'mailto:natanaelbeltre03@gmail.com', 
    icon: Mail, 
    label: 'Email',
    title: 'Enviar email'
  },
  { 
    href: 'https://wa.me/18298569592', 
    icon: MessageCircle, 
    label: 'WhatsApp',
    title: 'Contactar por WhatsApp'
  },
];

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        {/* Left: App info */}
        <div className="footer-section footer-brand">
          <span className="footer-app-name">Gestor de Tareas</span>
          <span className="footer-version">v2.0</span>
        </div>

        {/* Center: Social links */}
        <div className="footer-section footer-socials">
          {SOCIAL_LINKS.map(({ href, icon: Icon, label, title }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              title={title}
              aria-label={label}
            >
              <Icon size={15} />
            </a>
          ))}
          <span className="footer-divider" />
          <a
            href="https://natanael-1a2b.github.io/Mi-Portafolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-portfolio-link"
            title="Ver mi portafolio"
          >
            <ExternalLink size={13} />
            Portafolio
          </a>
        </div>

        {/* Right: Copyright */}
        <div className="footer-section footer-copy">
          <span>
            Desarrollado por{' '}
            <a
              href="https://natanael-1a2b.github.io/Mi-Portafolio/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-author-link"
            >
              Claudio Natanael
            </a>
          </span>
          <span className="footer-year">© {currentYear}</span>
        </div>
      </div>
    </footer>
  );
}
