import './globals.css';

export const metadata = {
  title: 'QuestionCraft AI - Question Paper Generator',
  description: 'AI-powered Question Paper Generator Dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
