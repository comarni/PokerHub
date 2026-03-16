import './globals.css';

export const metadata = {
  title: 'PokerHub - 3D Casino',
  description: 'Interactive 3D poker analysis platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
