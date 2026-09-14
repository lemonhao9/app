import { Outlet, useLocation } from 'react-router-dom';
import { NavBar } from './ui/NavBar';
import { Footer } from './ui/Footer';

export function PublicLayout() {
    const { pathname } = useLocation();
    const dark = pathname !== '/';

    return (
        <>
            <NavBar dark={dark} />
            <Outlet />
            <Footer />
        </>
    );
}
