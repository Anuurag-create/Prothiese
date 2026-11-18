import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import InputScreen from './pages/InputScreen';
import Learn from './pages/Learn';
import Build from './pages/Build';
import MyProjects from './pages/MyProjects';

const SKILLSPHERE_SESSION_KEY = 'skillsphere.session.v1';

function ProthieseSessionGate({ children }) {
  const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem(SKILLSPHERE_SESSION_KEY)));

  useEffect(() => {
    const syncSession = (event) => {
      if (!event || event.key === SKILLSPHERE_SESSION_KEY) {
        setAuthenticated(Boolean(localStorage.getItem(SKILLSPHERE_SESSION_KEY)));
      }
    };
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, []);

  if (!authenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-clarum-bg px-6">
        <div className="max-w-md text-center bg-white border border-[#E5E5EA] rounded-3xl p-10 shadow-apple">
          <div className="text-3xl font-bold tracking-tight text-[#1D1D1F] mb-3">Prothiese</div>
          <h1 className="text-xl font-semibold text-[#1D1D1F] mb-2">Sign in required</h1>
          <p className="text-sm text-[#86868B] leading-relaxed mb-6">Clarum is part of your Prothiese workspace. Sign in with your SkillSphere account to continue.</p>
          <a href="/#/login" target="_top" className="inline-flex items-center justify-center rounded-full bg-[#1D1D1F] text-white px-6 py-3 text-sm font-semibold">Sign in to Prothiese</a>
        </div>
      </div>
    );
  }
  return children;
}

export default function App() {
  const [, setActiveProjectId] = useState(null);
  return (
    <ProthieseSessionGate>
      <Router>
        <div className="h-screen w-screen overflow-hidden bg-clarum-bg text-clarum-text">
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
            <Navigation />
          </div>
          <main className="w-full h-screen">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/learn/input" element={<InputScreen mode="learn" setActiveProject={setActiveProjectId} />} />
              <Route path="/build/input" element={<InputScreen mode="build" setActiveProject={setActiveProjectId} />} />
              <Route path="/learn/:id" element={<Learn setActiveProject={setActiveProjectId} />} />
              <Route path="/build/:id" element={<Build setActiveProject={setActiveProjectId} />} />
              <Route path="/projects" element={<MyProjects />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ProthieseSessionGate>
  );
}
