import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/ui/Layout";
import Dashboard from "./pages/Dashboard";
import SkillDetail from "./pages/SkillDetail";
import NewSkill from "./pages/NewSkill";
import Resources from "./pages/Resources";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="skill/new" element={<NewSkill />} />
          <Route path="skill/:id" element={<SkillDetail />} />
          <Route path="resources" element={<Resources />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
