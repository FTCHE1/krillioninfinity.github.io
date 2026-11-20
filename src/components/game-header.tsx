import { Link, useLocation } from '@tanstack/react-router';
import { Library, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GameHeader() {
  const { pathname } = useLocation();
  return <header className="site-header"><Link to="/" className="brand"><span className="brand-symbol">∞</span><span>Krillion Infinity</span></Link><nav className="flex items-center gap-2"><Button asChild variant="ghost" className="nav-link" data-active={pathname === '/'}><Link to="/">Play</Link></Button><Button asChild variant="ghost" className="nav-link" data-active={pathname === '/scores'}><Link to="/scores"><Trophy className="nav-label-extra"/>Scores</Link></Button><Button asChild variant="ghost" className="nav-link" data-active={pathname === '/library'}><Link to="/library"><Library className="nav-label-extra"/><span className="nav-label-extra">Question </span>Library</Link></Button></nav></header>;
}