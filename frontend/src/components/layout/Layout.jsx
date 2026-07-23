import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-50 transition-colors duration-200">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
