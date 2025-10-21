import { ThemeProvider } from './components/providers/ThemeProvider';
import { Layout } from './components/layout/Layout';
import { DesignSystemDemo } from './pages/DesignSystemDemo';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="kori-theme">
      <Layout>
        <DesignSystemDemo />
      </Layout>
    </ThemeProvider>
  );
}

export default App;