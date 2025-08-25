import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Homepage from "@/pages/Homepage";
import History from "@/pages/History";
import Trends from "@/pages/Trends";
import EntryDetail from "@/pages/EntryDetail";
import Settings from "@/pages/Settings";
import ManageEntries from "@/pages/ManageEntries";
import TestPieChart from "@/pages/TestPieChart";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/history" element={<History />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/entry/:id" element={<EntryDetail />} />
          <Route path="/manage" element={<ManageEntries />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/test-pie" element={<TestPieChart />} />
        </Routes>
      </Layout>
    </Router>
  );
}
