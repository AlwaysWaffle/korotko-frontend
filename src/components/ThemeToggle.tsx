import { useState } from 'react'

type Theme = 'dark' | 'light'

function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getTheme)

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = nextTheme
    localStorage.setItem('theme', nextTheme)
    setTheme(nextTheme)
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Включить ${theme === 'dark' ? 'светлую' : 'тёмную'} тему`}>
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
        </svg>
      )}
      <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
    </button>
  )
}
