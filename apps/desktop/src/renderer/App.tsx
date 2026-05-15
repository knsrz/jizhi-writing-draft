import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/ui/sidebar';
import HistoryPage from './pages/History';
import KnowledgePage from './pages/Knowledge';
import KnowledgeDetailPage from './pages/KnowledgeDetail';
import SettingsPage from './pages/Settings';
import WritingPage from './pages/Writing';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[#eef4fb] text-slate-950">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<WritingPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/:projectId" element={<WritingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
